---
layout: default
title: Facial Recognition - Small Version
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
  </ol>
</details>

## Overview and Objective
This project is a pilot initiative developed in 2022, designed to establish a foundational model for facial recognition that can accurately identify and verify faces. By harnessing the power of deep learning techniques, the model aspires to deliver highly accurate and efficient facial recognition capabilities. The ultimate goal is to create a scalable solution and a fully functional deep learning workflow that can be utilized to advance CNN (Convolutional Neural Network) projects and any computer vision application.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Motivation and Inspiration
This facial recognition project is inspired by the remarkable capabilities of the human eye and brain, which can effortlessly detect and recognize multiple objects and faces simultaneously. In everyday situations, humans can quickly identify individuals across various environments, regardless of lighting, angles, or distractions, thanks to the brain's ability to process complex visual data into recognizable patterns. This natural ability forms the foundation of my project, which aims to replicate and enhance human facial recognition using advanced technology.

By mimicking the human visual system, my goal is to create a highly accurate and efficient facial recognition system that excels in dynamic real-world scenarios, bridging the gap between human perception and artificial intelligence. On the other hand, faces are among the most challenging objects to recognize due to the vast similarities among human faces. Even small facial features can resemble those of other individuals. If this deep learning model can achieve high accuracy despite the many variations in human facial features. I believe that this algorithm and deep learning model can be applied to a wide range of objects beyond just facial recognition.

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

   I encountered difficulties in gathering data through Kaggle.com, so the solution was to create a bot. I developed an automation bot using the Selenium module to collect facial images. The bot's task is to gather images by using celebrity names as keywords, searching through Google Images, and downloading as many images as I need (in this case, I collected 100 images per keyword). To speed up the data collection process, I implemented multi-threading, running 10 bots simultaneously, each with different keyword tasks. For the initial data collection, I used 300 celebrity names as keywords.

   <div align="center">
     <img src="/assets/page4/001.png" alt="Logo" width="1000">
   </div>

   In total, I collected around 28,926 image files, organized into folders based on the respective keywords.

   <div align="center">
     <img src="/assets/page4/002.png" alt="Logo" width="1000">
   </div>

2. Cropping Images

   I encountered an issue where the downloaded images were random, so I needed to ensure that I was specifically getting facial images. The solution was to create an automation process that could crop only the faces using OpenCV, leveraging the Haar Cascade method.

   <div align="center">
     <img src="/assets/page4/003.png" alt="Logo" width="1000">
     <img src="/assets/page4/004.png" alt="Logo" width="1000">
   </div>

3. Data Cleaning

   - At this stage, I had to manually verify whether the collected facial images were correct, as sometimes the images included pictures of other individuals. I needed to remove any faces that did not match the criteria.

     <div align="center">
       <img src="/assets/page4/005.png" alt="Logo" width="1000">
     </div>
     
   - In this step, I calculated the cropped images to ensure the sample set was heterogeneous. The folder of cropped images needed to contain 50 images; once a folder met this requirement, my code would copy the images to another directory.

     <div align="center">
       <img src="/assets/page4/006.png" alt="Logo" width="1000">
     </div>

   - At this point, I had to manually select 100 folders to be used as samples.

     <div align="center">
       <img src="/assets/page4/007.png" alt="Logo" width="1000">
     </div>
     
   - Finally, each folder of images needed to have 100 sample images. To achieve this, I created code that could duplicate images as necessary.
     
     <div align="center">
       <img src="/assets/page4/008.png" alt="Logo" width="1000">
       <img src="/assets/page4/009.png" alt="Logo" width="1000">
     </div>
     
4. Training Model
   - I loaded the samples into an array with 96 x 96 pixels as my input tensor, consisting of 10,000 samples. In this case, the input tensor represents celebrity face images, and the output tensor corresponds to 100 celebrity names.

     <div align="center">
       <img src="/assets/page4/010.png" alt="Logo" width="1000">
     </div>
     
   - I used 10,000 images as my sample set, with 7,000 images allocated for training (70%), 2,000 images for testing (20%), and 1,000 images for validation (10%). The deep learning CNN models will use 26 million trainable parameters.

     <div align="center">
       <img src="/assets/page4/011.png" alt="Logo" width="1000">
       <img src="/assets/page4/012.png" alt="Logo" width="1000">
     </div>
     
   - The model was tested over 50 epochs and achieved an accuracy of over 0.80 OR 80%.

     <div align="center">
       <img src="/assets/page4/013.png" alt="Logo" width="1000">
     </div>
     
   - I evaluated the model using the test samples, and the results confirmed an accuracy of over 0.80 or 80%.
     
     <div align="center">
       <img src="/assets/page4/014.png" alt="Logo" width="1000">
     </div>

9. Filter & Feature Map Check
   - Here are examples of filters produced by this deep learning model.

     <div align="center">
       <img src="/assets/page4/015.png" alt="Logo" width="1000">
     </div>

   - Here are feature maps generated by this deep learning model.

     <div align="center">
       <img src="/assets/page4/016.png" alt="Logo" width="1000">
     </div>


11. Testing Trained Model
    I created test images for demonstration purposes as a benchmark for my actual accuracy.

    <div align="center">
      <img src="/assets/page4/017.png" alt="Logo" width="1000">
    </div>

    The results reveal that the facial recognition is not perfect, as illustrated by the screenshots below which trained for 80 % accuracy only. You can see that the facial images serve as the input tensor, while the filenames represent the output tensor of the detection.

    <div align="center">
      <img src="/assets/page4/018.png" alt="Logo" width="1000">
    </div>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Challenges
1. **Data Collection Speed:** The data collection was very slow due to the use of a single bot. Therefore, I developed a multi-threaded bot that can run simultaneously.
2. **Network Constraints:** Network limitations can affect image data quality and potentially cause crashes. Hence, I need to limit the number of bots running the process.
3. **Scalability:** Managing and processing large datasets of facial images while maintaining high performance and accuracy.
4. **Diverse Conditions:** Handling variations in lighting, facial expressions, and angles to ensure reliable recognition in different environments.
5. **Model Training:** Training the model with a diverse and comprehensive dataset to avoid bias and ensure that the model generalizes well to unseen faces.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Insights
1. **Parallel Processing:** Techniques like parallel computing can enhance performance by executing multiple operations simultaneously.
2. **Convolutional Neural Networks (CNN):** CNNs are vital for extracting complex features from facial images. They can automatically learn hierarchical features, such as edges, textures, and patterns, from raw pixel data. In facial recognition, deeper CNN layers capture high-level features like facial shapes, eyes, and noses.
3. **Multiscale and Multiview Features:** To address variations in facial expressions, skin tones, feature sizes, angles, and lighting, extracting features at multiple scales and viewpoints can significantly improve recognition accuracy.
4. **GPU Acceleration:** Graphics Processing Units (GPUs) significantly speed up the training and inference processes for deep learning models.
5. **System Optimization:** Regular optimization and updates of algorithms and hardware are essential to maintain real-time performance as the system scales.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Future Plans
1. **Diverse Data Collection:** Gather data from a variety of sources to capture different facial expressions, ages, ethnicities, and lighting conditions. This helps in building a more comprehensive and unbiased model.
2. **Data Augmentation:** Apply techniques such as image rotation, scaling, and color adjustment to artificially expand the training dataset and enhance the model's generalization.
3. **Improve Accuracy:** Continuously refine the model by incorporating advanced deep learning techniques and expanding the dataset to enhance recognition accuracy and robustness.
4. **Integration with Applications:** Develop integration solutions for various applications, such as security systems, personalized services, and enhanced customer experiences.
5. **Scalable AI Solutions:** Leverage AI platforms that offer scalable and flexible solutions, allowing you to adjust resources on demand.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
