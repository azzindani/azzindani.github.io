---
layout: default
title: page1
profile: false
headline: false
---

# Lungs Detection

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
  </ol>
</details>

## Overview and Objective
This project, initiated in 2021, aims to develop a computer vision system capable of detecting and localizing lungs in medical images such as CXR (Chest X-Ray) or CT scans. By accurately identifying the lung boundaries, the model will lay the foundation for further analysis, including detecting lung diseases like Covid-19. This detection system represents the first step in building a more comprehensive tool for diagnosing and monitoring various conditions affecting internal organs.

The primary goal is to create a reliable computer vision model that can accurately detect lungs in medical images. This system will not only assist in lung health analysis but will also serve as a basis for detecting other internal organs, enabling more comprehensive diagnostic capabilities for a range of medical conditions. However, for now, the project's focus remains solely on lung detection.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Motivation and Inspiration
The Covid-19 pandemic served as the primary catalyst for this project. Witnessing the global impact of the virus and the urgent need for advanced diagnostic tools inspired me to contribute to the development of a scalable and accurate detection system. This project represents a foundational step toward creating a Covid-19 detection model by focusing on lung detection in X-ray images. Accurate lung detection is crucial for isolating the target area, enabling more precise and efficient model training for disease identification.

Moreover, this project is not only a step toward Covid-19 detection but also a proof of concept demonstrating the potential of deep learning in medical imaging. It shows that specific organs or objects within the human body can be accurately detected through CXR or other X-ray images if the model is trained with appropriate data. This capability has far-reaching implications beyond Covid-19, paving the way for detecting various other conditions and abnormalities in multiple organs. It enhances the effectiveness of diagnostic tools and supports advancements in personalized medicine.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Workflow
Below is the workflow on how my project works

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Solution and Technology Stack
Used tools:
1. TensorFlow Object Detection API
2. Pretrained Model
3. Python library : TensorFlow, Open CV, Scikit-Learn, Numpy, LabelImg
4. Hardware : Laptop Acer Predator Helios 300, Intel-12700H, 48 GB Ram, Gen4 SSD, RTX3070Ti Laptop GPU, 8 GB Vram

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Project Details and Results
1. Data Collection
2. Labelling
3. Generate Training Records
4. Training Model using TensorFlow OD API
5. Detection Test
6. Cropping Test

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Challenges
1. **Data Labeling:** Acquiring accurately labeled medical images, particularly with precise lung boundaries, is challenging due to the specific expertise required.
2. **Anatomical Variation:** The size, shape, and position of lungs can vary significantly among individuals, making it difficult to generalize across the population.
3. **Limited Training Data:** The availability of medical images for training may be limited, which can impact the robustness of the model.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Insights
1. **Adaptability:** The techniques developed for lung detection can be adapted to other internal organs such as the heart, liver, or kidneys, providing a versatile tool for broader medical applications.
2. **Radiologist Collaboration:** Collaborating with medical experts offers valuable insights into key anatomical markers for accurate lung detection, enhancing the model’s precision.
3. **Feature Localization:** The model’s ability to highlight specific areas within the lungs can assist doctors in identifying anomalies such as tumors, infections, or structural changes.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Future Plans
1. **Expand Organ Detection:** Build upon this foundation to detect other internal organs in medical images, such as the liver, kidneys, and heart, enabling a comprehensive diagnostic system for various health conditions.
2. **Real-Time Diagnostics:** Develop a web-based platform where doctors can upload images for real-time lung detection and analysis, enhancing efficiency in clinical settings.
3. **Enhanced Lung Disease Detection:** Extend the model to detect diseases like pneumonia, lung cancer, and eventually Covid-19 by training the system to recognize specific pathological features.
4. **Improved Model Accuracy:** Continuously refine the model by incorporating larger and more diverse datasets, and integrating advanced deep learning techniques like attention mechanisms and U-Net architectures for better segmentation.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
