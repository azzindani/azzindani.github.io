---
layout: default
title: Facial Recognition - Large Version
profile: false
headline: false
---

<a id="readme-top"></a>

[HOME](https://azzindani.github.io/)

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

**Project Reference**
- [Facial Recognition - Small Version](https://azzindani.github.io/docs/page4.html)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Workflow
Below is the workflow on how my project works

<div align="center">
  <img src="/assets/page5/000.png" alt="Logo" width="1000">
</div>
<br>

1. Problem Definition
   - Clearly define the problem that needs to be solved.<br>

2. Finding Solutions
   - List all potential solutions and select one for implementation.  
   - Set objectives (e.g., classification accuracy, minimizing prediction errors) and constraints (e.g., time, hardware limitations).  
   - Develop a plan that outlines the expected outcomes.<br>

3. Data Collection
   - Gather and prepare relevant datasets aligned with the problem.  
   - If batch datasets are unavailable, develop a data collection process like web scraping.<br>

4. Data Preprocessing
   - Clean and sort relevant datasets.  
   - Handle missing data or outliers.  
   - Perform data augmentation.  
   - Split the data into training, validation, and test sets.<br>

5. Model Building
   - Select a deep learning model architecture based on the problem (e.g., CNN for images, RNN/LSTM for sequential data, Transformer for NLP).  
   - Configure layers (convolutional, dense, recurrent, etc.), activations, and connectivity.  
   - Choose an optimizer (e.g., Adam, SGD, RMSProp).  
   - Set hyperparameters such as learning rate, batch size, and number of epochs.<br>

6. Train & Test Model
   - Train the model, setting targets for accuracy, loss, and other performance metrics.  
   - Test the model using the test dataset to evaluate its performance.  
   - Inspect feature maps and filters.  
   - Conduct real-world testing with external datasets to ensure the model's accuracy and applicability.<br>

7. Fine-Tuning
   - Hyperparameter Tuning: Adjust learning rate, batch size, number of layers, etc., to enhance performance.  
   - Regularization: Apply techniques like dropout, weight decay, or L2 regularization to avoid overfitting.  
   - Transfer Learning: Fine-tune pre-trained models on new datasets if the original task is similar.<br>

8. Evaluation & Improvement
   - Evaluate inputs, processes, outputs, and outcomes.  
   - Identify challenges.  
   - Gain insights.  
   - Implement necessary improvements by addressing challenges, adding new features, or refining results based on evaluation feedback.  
   - Develop a plan for future enhancements.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Solution and Technology Stack
Used tools:
1. Python library : ![TensorFlow](https://img.shields.io/badge/TensorFlow-%23FF6F00.svg?style=for-the-badge&logo=TensorFlow&logoColor=white) ![Keras](https://img.shields.io/badge/Keras-%23D00000.svg?style=for-the-badge&logo=Keras&logoColor=white) ![scikit-learn](https://img.shields.io/badge/scikit--learn-%23F7931E.svg?style=for-the-badge&logo=scikit-learn&logoColor=white) ![NumPy](https://img.shields.io/badge/numpy-%23013243.svg?style=for-the-badge&logo=numpy&logoColor=white) ![Matplotlib](https://img.shields.io/badge/Matplotlib-%23ffffff.svg?style=for-the-badge&logo=Matplotlib&logoColor=black) ![Selenium](https://img.shields.io/badge/selenium-43B02A.svg?style=for-the-badge&logo=selenium&logoColor=white)
2. Hardware : Laptop Acer Predator Helios 300, Intel-12700H, 48 GB Ram, Gen4 SSD, RTX3070Ti Laptop GPU, 8 GB Vram

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Project Details and Results
1. Data Collection

   I encountered difficulties in collecting data through Kaggle.com, so I developed a solution by creating an automation bot. This bot, built using the Selenium module, was designed to gather facial images by using celebrity names as keywords. It browses Google Images and downloads the desired number of images (100 per keyword). To speed up the data collection process, I implemented multi-threading, running 10 bots simultaneously, each with different keywords.

   For the initial data collection, I used 1,898 celebrity names as keywords, collecting approximately 178,934 image files organized into folders based on the keywords, developed in 2022.

   <div align="center">
     <img src="/assets/page5/001.png" alt="Logo" width="1000">
   </div>
   <br>
   
   **The latest data collection update has been prepared for 10,000 keywords, gathering over 1 million images. Currently, more than 500,000 images and over 9,000 keyword folders remain to be processed.**

   <div align="center">
     <img src="/assets/page5/002.png" alt="Logo" width="1000">
   </div>
   <br>

2. Cropping Images

   I cropped all the images using OpenCV with the Haar Cascade method.

   <div align="center">
     <img src="/assets/page5/003.png" alt="Logo" width="1000">
     <img src="/assets/page5/004.png" alt="Logo" width="1000">
   </div>
   <br>

3. Data Cleaning
   - At this stage, I had to manually verify whether the collected facial images were correct, as sometimes they included pictures of other people. I needed to remove any faces that did not match the criteria.
  
     <div align="center">
       <img src="/assets/page5/005.png" alt="Logo" width="1000">
     </div>
     <br>
     
   - In this step, I counted the cropped images to ensure that the samples were filled with heterogeneous images. Each folder of cropped images needed to contain 30 images; once a folder met this requirement, my code would copy the images to another directory.
  
     <div align="center">
       <img src="/assets/page5/006.png" alt="Logo" width="1000">
     </div>
     <br>

   - For this step, each folder of images needed to contain 50 sample images. I created code to populate new folders with 50 images. If the source already contained more than 50 images, only 50 images would be copied to the new folder; if the source had fewer than 50 images, images would be duplicated until the new folder contained 50 images.
     
     <div align="center">
       <img src="/assets/page5/007.png" alt="Logo" width="1000">
     </div>
     <br>
   
   Currently, I have collected over 1,000 celebrity faces that are ready for model training. I still have more than 4,000 celebrity faces that need to be cleaned and processed.
   - Samples to be used for training

     <div align="center">
       <img src="/assets/page5/008.png" alt="Logo" width="1000">
     </div>
     <br>
     
   - **Remaining dataset for future development**

     <div align="center">
       <img src="/assets/page5/009.png" alt="Logo" width="1000">
     </div>
     <br>

4. Data Augmentation

   To increase the quantity of images and obtain more samples, I needed data augmentation to expand the dataset. Here's an example of data augmentation techniques to multiply 50 images in each folder into 500 images per folder.

   <div align="center">
     <img src="/assets/page5/010.png" alt="Logo" width="1000">
   </div>
   <br>

   The result

   <div align="center">
     <img src="/assets/page5/011.png" alt="Logo" width="1000">
     <img src="/assets/page5/012.png" alt="Logo" width="1000">
   </div>
   <br>

5. Training Model

   I have rigorously trained multiple times to ensure the capabilities of this deep learning algorithm with varying samples of faces and images.

   <div align="center">
     <img src="/assets/page5/013.png" alt="Logo" width="1000">
   </div>
   <br>
   
   For instance, I will demonstrate using a dataset of 1000 unique faces, each with 100 images, as follows:
   - I loaded these samples into an array with 96 x 96 pixel dimensions as my input tensor, encompassing 100,000 samples. In this scenario, the input tensor consists of celebrity face images, while the output tensor represents 650 celebrity names.

     <div align="center">
       <img src="/assets/page5/014.png" alt="Logo" width="1000">
       <img src="/assets/page5/015.png" alt="Logo" width="1000">
     </div>
     <br>
     
   - I utilized 100,000 images as my dataset, partitioning it into 70,000 images for training (70%), 20,000 images for testing (20%), and 10,000 images for validation (10%). The deep learning CNN models will use 28 million trainable parameters.

     <div align="center">
       <img src="/assets/page5/016.png" alt="Logo" width="1000">
     </div>
     <br>
     
   - I set an accuracy threshold of 0.97 or 97% to halt the training process, achieving 231 epochs in the process.

     <div align="center">
       <img src="/assets/page5/017.png" alt="Logo" width="1000">
       <img src="/assets/page5/018.png" alt="Logo" width="1000">
     </div>
     <br>
     
   - Upon testing with the validation samples, the model achieved an accuracy of 0.97 or 97%.

     <div align="center">
       <img src="/assets/page5/019.png" alt="Logo" width="1000">
     </div>
     <br>

6. Filter & Feature Map Check
   - Here are the filters generated by this deep learning model.

     <div align="center">
       <img src="/assets/page5/020.png" alt="Logo" width="1000">
     </div>
     <br>
     
   - Here are the feature maps produced by this deep learning model.

     <div align="center">
       <img src="/assets/page5/021.png" alt="Logo" width="1000">
     </div>
     <br>

7. Testing Trained Model

   I created test demonstration images as a benchmark for evaluating the true accuracy of my model.

   <div align="center">
     <img src="/assets/page5/022.png" alt="Logo" width="1000">
   </div>
   <br>

   The results indicate that I achieved authentic face recognition, though not perfectly, as illustrated in the screenshot below. You can observe that the face images serve as the input tensor, while the filenames represent the output tensor from the detection.

   <div align="center">
     <img src="/assets/page5/023.png" alt="Logo" width="1000">
     <img src="/assets/page5/024.png" alt="Logo" width="1000">
   </div>

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
