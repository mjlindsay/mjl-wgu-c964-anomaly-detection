import json
import numbers
import numpy as np
from river import preprocessing, metrics, datasets, compose, anomaly
import pandas as pd

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

def transform_example_data():
    with open('trace_training_data.json') as f:
        training_data = json.load(f)

        classified_data = []

        for record in training_data:
            model.learn_one(record)

        for record in training_data:
            score = model.score_one(record)
            anomaly = model["ThresholdFilter"].classify(score)
            classified_data.append(record | {
                "score": score,
                "is_anomaly": anomaly
            })

        with open('trace_data_transformed_classified.json', 'w') as cf:
            json.dump(classified_data, cf)

transform_example_data()