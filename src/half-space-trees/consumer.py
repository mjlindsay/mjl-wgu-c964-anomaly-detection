#!/usr/bin/env python

import argparse
import datetime
import json
from confluent_kafka import Consumer
from river import preprocessing, metrics, datasets, compose, anomaly
from csv import writer

parser = argparse.ArgumentParser(
    description='Anomaly detection using Half-Space Trees'
)

parser.add_argument(
    '-t', '--training',
    default=False,
    action='store_true',
    help='Run in training mode (learning without anomaly detection)')

parser.add_argument(
    '-s', '--stage-output',
    default=False,
    action='store_true',
    help='Output feature data at different stages of the pipeline (raw input, manual, etc.)'
)

args = parser.parse_args()

def write_stage(stage_name, dict):
    if not args.stage_output:
        return
    
    timestamp = datetime.datetime.now().strftime('%H-%M-%S-%f')

    with open(f'{stage_name}_{timestamp}.json', 'w') as f:
        json.dump(dict, f, indent=4)

def extract_metric_features(data):
    flattened_features = {}

    # Attempt to process the metrics we want, but otherwise don't need to do anything
    # try:
    scope_metrics = data["resourceMetrics"][0]["scopeMetrics"]
    for scope_metric in scope_metrics:
        for metric in scope_metric["metrics"]:
            metric_name = metric["name"]
            if metric_name == 'http.server.request.duration':
                flattened_features = flattened_features | extract_request_duration_features(metric_name, metric)
            # Do not get others for now
    # except:
    #     print("uh oh")
    
    return flattened_features

# Define a map of http methods to integer values. We could use
# a preprocessor to do this, but it's a finite number of values
# and it was honestly easier than configuring the preprocessor.
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

def extract_request_duration_features(metric_name, metric):
    features = {}

    # Loop dataPoints and tabulate
    for dp in metric['histogram']['dataPoints']:
        dict_attributes = {attr['key']: attr['value'] for attr in dp['attributes']}

        route_attr = dict_attributes.get('http.route', None)
        if route_attr is None:
            continue

        route = route_attr['stringValue']
        if route in exclude_routes:
            continue

        count = int(dp.get('count', 0))
        total_duration = dp['sum']
        avg_duration = 0

        if count > 0:
            avg_duration = total_duration / count

        method = dict_attributes['http.request.method']['stringValue']
        status_code = int(dict_attributes['http.response.status_code']['intValue'])

        route_feature_key = f'{method}.{status_code}.{route}'
        features = features | {
            f'{route_feature_key}.request_count': count,
            f'{route_feature_key}.total_duration': total_duration,
            f'{route_feature_key}.avg_duration': avg_duration,
            f'{route_feature_key}.status_code': status_code
        }

    return features

# Setup ML Model
scaler = preprocessing.MinMaxScaler()
half_space_trees = anomaly.HalfSpaceTrees(
    n_trees=10,
    height=3,
    window_size=1000,
    seed=10427
)
filter = anomaly.QuantileFilter(q = 0.95, anomaly_detector=half_space_trees)

model = compose.Pipeline(
    scaler,
    filter
)

accuracy = metrics.Accuracy()

def do_anomaly_detection(features: dict):
    # Anomaly detection!
    model.learn_one(features)
    score = model.score_one(features)
    is_anomaly = model['QuantileFilter'].classify(score)

    print(f"Features: {features}, Score: {score}, Anomaly: {is_anomaly}")

training_data_buffer = []
def record_training_data(features: dict):    
    is_anomaly = False

    for feature_key, feature_value in features.items():
        if "status_code" in feature_key:
            if feature_value >= 300:
                is_anomaly = True
                break
        if "avg_duration" in feature_key:
            if feature_value >= .275:
                is_anomaly = True
                break
    
    features = features | { is_anomaly: is_anomaly }

    training_data_buffer.append(features)

    if len(training_data_buffer) >= 1500:
        timestamp = datetime.datetime.now().strftime('%H-%M-%S-%f')

        with open(f'training_data_{timestamp}.json', 'w') as f:
            json.dump(training_data_buffer, f, indent=4)
        
        training_data_buffer.clear()

if __name__ == '__main__':
    config = {
        # User-specific properties that you must set
        'bootstrap.servers': 'host.docker.internal:9094',

        # Fixed properties
        'group.id':          'kafka-python-getting-started',
        'auto.offset.reset': 'earliest'
    }

    # Create Consumer instance
    consumer = Consumer(config)

    # Subscribe to topic
    topic = "otlp_metrics"
    consumer.subscribe([topic])

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
                # Extract the (optional) key and value, and print.
                print("Consumed event from topic {topic}: value = {value:12}".format(
                    topic=msg.topic(), value=msg.value().decode('utf-8')))

                data = json.loads(msg.value())

                write_stage('raw', data)
                
                manually_transformed_features = extract_metric_features(data)
                write_stage('manual', manually_transformed_features)

                if args.training:
                    record_training_data(manually_transformed_features)
                else:
                    do_anomaly_detection(manually_transformed_features)
    except KeyboardInterrupt:
        pass
    finally:
        # Leave group and commit final offsets
        consumer.close()