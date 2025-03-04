#!/usr/bin/env python

import datetime
import json
from confluent_kafka import Consumer
from river import preprocessing

oh = preprocessing.OneHotEncoder()
def one_hot_encode(raw_json):
    return oh.transform_one(raw_json)

fh = preprocessing.FeatureHasher()
def feature_hash(raw_json):
    return oh.transform_one(raw_json)

def write_stage(stage_name, dict):
    timestamp = datetime.datetime.now().strftime('%H-%M-%S-%f')

    with open(f'{stage_name}_{timestamp}.json', 'w') as f:
        json.dump(dict, f, indent=4)

ordinal_encoder = preprocessing.OrdinalEncoder()

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

def extract_request_duration_features(metric_name, metric):
    features = {
        'categorical': {},
        'unscaled_numeric': {}
    }

    # Loop dataPoints and tabulate
    for dp in metric['histogram']['dataPoints']:
        dict_attributes = {attr['key']: attr['value'] for attr in dp['attributes']}

        route_attr = dict_attributes.get('http.route', None)
        if route_attr is None:
            continue

        route = route_attr['stringValue']

        count = int(dp.get('count', 0))
        total_duration = dp['sum']
        avg_duration = 0

        if count > 0:
            avg_duration = total_duration / count

        method = dict_attributes['http.request.method']['stringValue']
        status_code = int(dict_attributes['http.response.status_code']['intValue'])

        features['unscaled_numeric'] = features['unscaled_numeric'] | {
            f'{route}.request_count': count,
            f'{route}.total_duration': total_duration,
            f'{route}.avg_duration': avg_duration,
            f'{route}.method': method_map[method],
            f'{route}.status_code': status_code,
        }

    return features

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

                # fh_transformed = feature_hash(data)
                # write_stage('feature_hash', fh_transformed)

                # oh_transformed = one_hot_encode(fh_transformed)
                # write_stage('one_hot', oh_transformed)

    except KeyboardInterrupt:
        pass
    finally:
        # Leave group and commit final offsets
        consumer.close()