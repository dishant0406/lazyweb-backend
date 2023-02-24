#!/bin/bash

# Define the source folder as the current directory
src_folder=$(pwd)

# Delete all png files in the source folder and its subdirectories
find "$src_folder" -type f -name "*.png" -delete

