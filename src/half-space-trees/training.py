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

#filter = anomaly.QuantileFilter(q = 0.6, anomaly_detector=half_space_trees)
#filter = anomaly.ThresholdFilter(half_space_trees, 0.6)
filter = anomaly.QuantileFilter(half_space_trees, q=0.85)

model = compose.Pipeline(
    scaler,
    filter
)

def learn_many_predict_many():
    with open('dist_cat_training_data.json') as f:
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

        with open('dist_tmpm_classified.json', 'w') as cf:
            json.dump(classified_data, cf)


def learn_one_predict_one():
    with open('dist_cat_training_data.json') as f:
        training_data = json.load(f)

        classified_data = []

        for dp in training_data:
            scaler.learn_one(dp)
            scored_features = scaler.transform_one(dp)

            classified_data.append(scored_features)
            # model.learn_one(dp)
            # score = model.score_one(dp)
            # is_anomaly = model["QuantileFilter"].classify(score)

            # classified_data.append(dp | {
            #     "is_anomaly": is_anomaly,
            #     "score": score
            # })
        
        with open('dist_l1p1.json', 'w') as cf:
            json.dump(classified_data, cf, indent=4)

learn_one_predict_one()
learn_many_predict_many()