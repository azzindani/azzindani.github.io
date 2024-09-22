---
layout: default
title: page1
profile: false
headline: false
---

# Large Facial Recognition

<a id="readme-top"></a>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li> <a href="#overview-and-objective">Overview and Objective</a></li>
    <li><a href="#motivation-and-inspiration">Motivation and Inspiration</a></li>
    <li><a href="#workflow">Workflow</a></li>
    <li><a href="#solution-and-technology-stack">Solution and Technology Stack</a></li>
    <li><a href="#project-details-and-results">Project Details and Results</a></li>
    <li><a href="#challenges">Challenges</a></li>
    <li><a href="#insights">Insights</a></li>
    <li><a href="#future-plans">Future Plans</a></li>
    <li><a href="#reference">Reference</a></li>
  </ol>
</details>

## Overview and Objective
This project, developed from 2022 to the present, aims to advance facial recognition on a larger scale by creating a sophisticated model capable of identifying and verifying thousands of faces. By leveraging deep learning techniques, the model seeks to deliver accurate and efficient facial recognition across various environments. The primary goal is to create a scalable solution and a fully functional deep learning workflow that can enhance CNN (Convolutional Neural Network) projects and any computer vision applications.

The project's objective is to develop a robust facial recognition model that can accurately recognize and verify thousands of faces, designed to manage a large-scale facial database while ensuring high accuracy.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Motivation and Inspiration
This facial recognition project is inspired by the remarkable capabilities of the human eye and brain, which can effortlessly detect and recognize multiple objects and faces simultaneously. Research indicates that the human brain can recognize an average of 5,000 faces and remember up to 10,000 faces. Leveraging this understanding, the project aims to harness the transformative potential of facial recognition technology to revolutionize various industries.

Traditional facial recognition methods often face challenges with scalability and accuracy when dealing with large datasets. By integrating rapid advancements in deep learning, this project seeks to develop a robust system capable of accurately handling and identifying thousands of faces.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Workflow
Below is the workflow on how my project works

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Solution and Technology Stack
Used tools:
1. Python library : TensorFlow, Open CV, Scikit-Learn, Numpy, Matplotlib, Selenium
2. Hardware : Laptop Acer Predator Helios 300, Intel-12700H, 48 GB Ram, Gen4 SSD, RTX3070Ti Laptop GPU, 8 GB Vram

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Project Details and Results
1. Data Collection
I ran into issues collecting data through Kaggle.com, so I created a solution by developing a bot. This automation bot, built with the Selenium module, was tasked with gathering facial images using celebrity names as keywords. It searched Google Images and downloaded the desired number of images (100 per keyword). To expedite the data collection process, I implemented multi-threading, running 10 bots simultaneously, each with different keywords. For the initial data collection, I used 1,898 celebrity names as keywords and collected around 178,934 image files, which were organized into folders by keyword.

3. Cropping Images
I cropped all the images using OpenCV with the Haar Cascade method.

5. Data Cleaning
a. At this stage, I had to manually verify whether the collected facial images were correct, as sometimes they included pictures of other people. I needed to remove any faces that did not match the criteria.
b. In this step, I counted the cropped images to ensure that the samples were filled with heterogeneous images. Each folder of cropped images needed to contain 30 images; once a folder met this requirement, my code would copy the images to another directory.
c. At this point, I manually selected 100 folders to be used as samples.
d. For this step, each folder of images needed to contain 50 sample images. I created code to populate new folders with 50 images. If the source already contained more than 50 images, only 50 images would be copied to the new folder; if the source had fewer than 50 images, images would be duplicated until the new folder contained 50 images.

7. Data Augmentation
To increase the quantity of images and obtain more samples, I needed data augmentation to expand the dataset. Here's an example of data augmentation techniques to multiply 50 images in each folder into 500 images per folder.

9. Training Model
I have rigorously trained multiple times to ensure the capabilities of this deep learning algorithm with varying samples of faces and images.

For instance, I will demonstrate using a dataset of 650 unique faces, each with 240 images, as follows:

a. I loaded these samples into an array with 96 x 96 pixel dimensions as my input tensor, encompassing 156,000 samples. In this scenario, the input tensor consists of celebrity face images, while the output tensor represents 650 celebrity names.
b. I utilized 156,000 images as my dataset, partitioning it into 109,200 images for training (70%), 31,200 images for testing (20%), and 15,600 images for validation (10%). I explored various CNN architectures, ultimately choosing the Inception V3 model with 27 million trainable parameters.
c. I set an accuracy threshold of 0.97 to halt the training process, achieving 52 epochs in the process.
d. Upon testing with the validation samples, the model achieved an accuracy of 0.97.

11. Filter & Feature Map Check
a. Here are the filters generated by this deep learning model.
b. Here are the feature maps produced by this deep learning model.

13. Testing Trained Model
I created test demonstration images as a benchmark for evaluating the true accuracy of my model.

The results indicate that I achieved authentic face recognition, though not perfectly, as illustrated in the screenshot below. You can observe that the face images serve as the input tensor, while the filenames represent the output tensor from the detection.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Challenges
1. **Web Scraping Duration:** Increasing the number of faces significantly extends the data collection time.
2. **Network Challenges:** Network limitations can impact image data quality and potentially cause system crashes. Therefore, I need to limit the number of bots running the process.
3. **Data Cleaning:** This process will be carried out manually, verifying whether the downloaded images match their labels.
4. **Hardware Limitations:** An increase in the number of faces and model parameters demands greater hardware capacity.
5. **Scalability:** Managing and processing large datasets of facial images while maintaining high performance, model scalability, and accuracy.
6. **Varied Conditions:** Addressing variations in lighting, facial expressions, and angles to ensure reliable recognition across diverse environments.
7. **Model Training:** Training the model with a diverse and comprehensive dataset to prevent bias and ensure the model generalizes well to unseen faces.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Insights
1. **Parallel Processing:** Techniques like parallel computing can enhance performance by executing multiple operations simultaneously.
2. **Convolutional Neural Networks (CNN):** CNNs are vital for extracting complex features from facial images. They can automatically learn hierarchical features, such as edges, textures, and patterns, from raw pixel data. In facial recognition, deeper CNN layers capture high-level features like facial shapes, eyes, and noses.
3. **Data Augmentation:** Implement augmentations such as rotation, scaling, brightness adjustments, and random cropping to simulate variations in facial orientation and lighting conditions.
4. **Transfer Learning:** Transfer learning is a machine learning technique where knowledge gained from one task or dataset is leveraged to improve model performance on related tasks and/or different datasets.
5. **Multiscale and Multiview Features:** To address variations in facial expressions, skin tones, feature sizes, angles, and lighting, extracting features at multiple scales and viewpoints can significantly improve recognition accuracy.
6. **GPU Acceleration:** Graphics Processing Units (GPUs) significantly speed up the training and inference processes for deep learning models.
7. **System Optimization:** Regular optimization and updates of algorithms and hardware are essential to maintain real-time performance as the system scales.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Future Plans
1. **Enhance Accuracy:** Continuously refine the model by incorporating advanced deep learning techniques and expanding the dataset to improve recognition accuracy and robustness.
2. **Integration with Applications:** Develop integration solutions for various applications, such as security systems, personalized services, and enhanced customer experiences.
3. **Scalable AI Solutions:** Leverage AI platforms that offer scalable and flexible solutions, allowing you to adjust resources on demand.
4. **Scalable Infrastructure:** Build a scalable infrastructure capable of handling growing datasets and user demands, including cloud-based solutions and distributed processing.
5. **Boost Recognition Performance:** Keep enhancing the model by implementing more sophisticated deep learning techniques and expanding the dataset to strengthen accuracy and recognition resilience.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Reference
1. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6191703/

<p align="right">(<a href="#readme-top">back to top</a>)</p>
