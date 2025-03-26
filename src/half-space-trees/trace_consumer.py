#!/usr/bin/env python

import argparse
import datetime
import json
import numbers
from confluent_kafka import Consumer
from river import preprocessing, metrics, datasets, compose, anomaly
from csv import writer
import configargparse

from opentelemetry import (
    trace,
    metrics
)
from opentelemetry.sdk.metrics import (
    MeterProvider,
    Histogram
)
from opentelemetry.sdk.metrics.export import (
    PeriodicExportingMetricReader,
    AggregationTemporality
)

from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import (
    OTLPMetricExporter
)

from opentelemetry.trace import SpanContext, NonRecordingSpan
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
from opentelemetry.sdk.trace.export import (
    SimpleSpanProcessor
)
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (
    OTLPSpanExporter
)

parser = argparse.ArgumentParser(
    description='Anomaly detection using Half-Space Trees'
)

parser.add_argument(
    '-t', '--training',
    default=False,
    action="store_true",
    env_var="TRAINING_MODE_ENABLED",
    help='Run in training mode (learning without anomaly detection)'
)

parser.add_argument(
    '-s', '--stage-output',
    default=False,
    action="store_true",
    env_var="STAGE_OUTPUT_ENABLED",
    help='Output feature data at different stages of the pipeline (raw input, manual, etc.)'
)

parser.add_argument(
    "-o", "--otlp-host",
    default="http://127.0.0.1:4319",
    env_var="OTLP_HOST",
    help="Host and port to emit telemetry to."
)

parser.add_argument(
    "-k", "--kafka-host",
    default="host.docker.internal:9094",
    env_var="KAFKA_HOST",
    help="Host and port of Kafka server to read traces from."
)

args = parser.parse_args()

metric_reader = PeriodicExportingMetricReader(OTLPMetricExporter(
    endpoint=args.otlp_host,
    insecure=True,
    preferred_temporality={Histogram: AggregationTemporality.DELTA}
), export_interval_millis=2000)
provider = MeterProvider(metric_readers=[metric_reader])

metrics.set_meter_provider(provider)

anomaly_meter = metrics.get_meter("anomaly.hst")
total_record_count_metric = anomaly_meter.create_counter("record_count")
anomalous_record_count_metric = anomaly_meter.create_counter("anomalous_record_count")
nominal_record_count_metric = anomaly_meter.create_counter("nominal_record_count")
model_accuracy_gauge = anomaly_meter.create_gauge("anomaly_model_accuracy")

anomaly_score_distribution = anomaly_meter.create_histogram(
    "anomaly_score_dist", 
    description="Distribution of anomaly scores from 0 (normal) to 1 (anomalous)",
    explicit_bucket_boundaries_advisory=[
        0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 
        0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1
    ]
)

anomaly_score_value = anomaly_meter.create_gauge("anomaly_score")

provider = TracerProvider()
processor = SimpleSpanProcessor(OTLPSpanExporter(
    endpoint=args.otlp_host,
    insecure=True
))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("anomaly.hst")
propogator = TraceContextTextMapPropagator()

def write_stage(stage_name, dict):
    '''
    Saves a JSON object to a file according to the stage name and timestamp. Useful for debugging and fast iteration.
    Does not do anything unless args.stage_output is set to true.
    '''
    if not args.stage_output:
        return
    
    timestamp = datetime.datetime.now().strftime('%H-%M-%S-%f')

    with open(f'{stage_name}_{timestamp}.json', 'w') as f:
        json.dump(dict, f, indent=4)

# Define a map of http methods to integer values. The OneHotEncoder can handle this, but
# it messes with the results in weird ways
method_map = {
    'GET': 0,
    'HEAD': 1,
    'POST': 2,
    'PUT': 3,
    'DELETE': 4,
    'CONNECT': 5,
    'OPTIONS': 6,
    'TRACE': 7,
    'PATCH': 8
}

# Routes that should not be included as they are used for setup and demonstration purposes.
exclude_routes = [
    "api/Anomaly",
]

def extract_trace_context(data):
    primary_span = data["resourceSpans"][0]["scopeSpans"][0]["spans"][0]
    trace_id = primary_span["traceId"]
    span_id = primary_span["spanId"]

    traceparent = f"00-{trace_id}-{span_id}-01"
    carrier = {"traceparent": traceparent}

    return propogator.extract(carrier=carrier)

def extract_trace_features(data):
    flattened_features = {}

    # Attempt to process the metrics we want, but otherwise don't need to do anything
    primary_span = data["resourceSpans"][0]["scopeSpans"][0]["spans"][0]
    trace_id = primary_span["traceId"]
    

    for attr in primary_span["attributes"]:
        if attr["key"] == "http.request.method":
            flattened_features = flattened_features | { "request_method": method_map[attr["value"]["stringValue"]] }
        elif attr["key"] == "error.type":
            flattened_features = flattened_features | { "error_type": attr["value"]["stringValue"] }
        elif attr["key"] == "http.route":
            route = attr["value"]["stringValue"]
            # Return condition if we are on a route we don't like
            if route in exclude_routes:
                return "", None
            
            flattened_features = flattened_features | { "route": attr["value"]["stringValue"] }
        elif attr["key"] == "http.response.status_code":
            # Keep a string -- this is categorical, so we need it to be onehot encoded
            flattened_features = flattened_features | { "status_code": attr["value"]["intValue"] }
        elif attr["key"] == "response.duration":
            flattened_features = flattened_features | { "duration": float(attr["value"]["doubleValue"]) }
        elif attr["key"] == "request.contentLength":
            flattened_features = flattened_features | { "request_length": int(attr["value"]["intValue"])}
    
    if flattened_features == {}:
        return trace_id, None
    else:
        return trace_id, flattened_features

# Setup ML Model
half_space_trees = anomaly.HalfSpaceTrees(
    n_trees=10,
    height=3,
    window_size=1000,
    seed=10427
)

# encoders for categorical and numerical data
cat = compose.SelectType(str) | preprocessing.OneHotEncoder()
num = compose.SelectType(numbers.Number) | preprocessing.StandardScaler()
scaler = (cat + num)

filter = anomaly.ThresholdFilter(half_space_trees, 0.8)

model = compose.Pipeline(
    scaler,
    filter
)

def load_baseline_data():
    print("Loading training data...")
    with open('baseline_data.json') as f:
        training_data = json.load(f)

        for record in training_data:
            model.learn_one(record)

def detect_anomaly(trace_id, features) -> bool:
    model.learn_one(features)
    score = model.score_one(features)
    is_anomaly = model['ThresholdFilter'].classify(score)

    anomaly_score_distribution.record(score)
    trace.get_current_span().set_attribute("is_anomaly", str(is_anomaly))

    total_record_count_metric.add(1)
    if is_anomaly:
        anomalous_record_count_metric.add(1)
    else:
        nominal_record_count_metric.add(1)


    print(f"Trace: {trace_id}, Features: {features}, Score: {score}, Anomaly: {is_anomaly}")

    return is_anomaly

training_data_buffer = []
def save_preprocessed_trace_record(features: dict):    
    '''
    Saves a pre-processed trace record for training and exploration purposes.
    '''
    training_data_buffer.append(features)

    if len(training_data_buffer) >= 1000:
        timestamp = datetime.datetime.now().strftime('%H-%M-%S-%f')

        with open(f'trace_training_data_processed_{timestamp}.json', 'w') as f:
            json.dump(training_data_buffer, f, indent=4)
        
        training_data_buffer.clear()

raw_trace_buffer = []
def save_raw_trace(trace):
    '''
    Saves a raw trace record for training and exploration purposes.
    '''
    raw_trace_buffer.append(trace)

    if len(raw_trace_buffer) >= 1000:
        timestamp = datetime.datetime.now().strftime('%H-%M-%S-%f')

        with open(f'trace_training_data_raw_{timestamp}.json', 'w') as f:
            json.dump(raw_trace_buffer, f, indent=4)
        
        raw_trace_buffer.clear()


if __name__ == '__main__':
    config = {
        # User-specific properties that you must set
        'bootstrap.servers': args.kafka_host,

        # Fixed properties
        'group.id':          'anomaly-ml-model',
        'auto.offset.reset': 'earliest'
    }

    # Create Consumer instance
    consumer = Consumer(config)

    # Subscribe to topic
    topic = "otlp_spans"
    consumer.subscribe([topic])

    if not args.training:
        load_baseline_data()

    # Poll for new messages from Kafka and print them.
    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                # Initial message consumption may take up to
                # `session.timeout.ms` for the consumer group to
                # rebalance and start consuming
                print("Waiting...")
            elif msg.error():
                print("ERROR: %s".format(msg.error()))
            else:
                raw_trace_data = json.loads(msg.value())

                source_context = extract_trace_context(raw_trace_data)
                with tracer.start_as_current_span("anomaly_detection", context=source_context) as span:
                    # Extract the (optional) key and value, and print.
                    print("Consumed event from topic {topic}: value = {value:12}".format(
                        topic=msg.topic(), value=msg.value().decode('utf-8')))

                    write_stage('raw', raw_trace_data)
                    
                    trace_id, manually_transformed_features = extract_trace_features(raw_trace_data)

                    # We don't want to handle data that we couldn't extract meaningful features from.
                    if (manually_transformed_features is None):
                        continue
                    
                    write_stage('manual', manually_transformed_features)

                    if args.training:
                        save_raw_trace(raw_trace_data)
                        save_preprocessed_trace_record(manually_transformed_features)
                    else:
                        detect_anomaly(trace_id, manually_transformed_features)
    except KeyboardInterrupt:
        pass
    finally:
        # Leave group and commit final offsets
        consumer.close()