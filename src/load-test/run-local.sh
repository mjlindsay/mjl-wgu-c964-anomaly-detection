#!/bin/bash

source local.env

echo $DURATION

k6 run script.js