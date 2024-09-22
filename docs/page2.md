---
layout: default
title: page1
profile: false
headline: false
---

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
This project, developed in 2021, harnesses the power of computer vision and deep learning techniques to detect Covid-19 from chest X-ray (CXR) images. By training a model on a carefully curated dataset of labeled medical images, the objective is to classify these images as either positive or negative for Covid-19. This initiative aspires to provide a faster and more automated diagnostic tool, empowering medical professionals to identify Covid-19 cases with remarkable accuracy, complementing traditional testing methods.

The primary aim of this project is to create an AI-powered system capable of swiftly and accurately detecting Covid-19 from medical images. This tool is designed to enhance diagnostic efficiency, reduce reliance on resource-intensive testing methods, and potentially broaden access to diagnostic capabilities in areas with limited healthcare infrastructure. By bridging technological innovation with healthcare needs, we strive to contribute meaningfully to the global fight against Covid-19.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Motivation and Inspiration
The global Covid-19 pandemic has highlighted the urgent need for rapid and accurate diagnostic tools, exposing the limitations of traditional testing methods like PCR tests, which, while effective, often require significant time and resources. Delays in testing and slow result turnaround emphasize the necessity for alternative approaches that can provide timely insights.

This reality has inspired me to explore the transformative potential of AI and computer vision in developing more accessible diagnostic methods through the analysis of CXR or CT scans. By leveraging deep learning models, my goal is to create a system that assists healthcare professionals in the early detection of Covid-19, significantly accelerating the diagnostic process.

Such advancements can not only alleviate the burden on healthcare systems but also enhance screening efficiency, particularly in resource-limited areas where access to traditional testing is constrained. Furthermore, the integration of AI-driven diagnostic tools can lead to better patient outcomes by enabling quicker interventions and more effective resource allocation. Ultimately, this project aims to democratize healthcare by providing advanced diagnostic capabilities to a broader population, fostering a more resilient and responsive healthcare infrastructure in the face of future public health challenges.

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

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Challenges
1. **Data Availability**: Accessing large and high-quality datasets of Covid-19 medical images can be challenging due to privacy and ethical concerns.
2. **Image Quality and Variability**: Medical images often differ significantly in quality, resolution, and positioning, making it difficult for models to generalize effectively.
3. **Model Generalization**: Ensuring that the model performs accurately across diverse populations, hospitals, and imaging equipment is crucial for real-world applications.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Insights
1. **Transfer Learning**: Leveraging pre-trained models significantly enhances performance when working with limited medical image data.
2. **Importance of Features**: By analyzing the areas of the images that the model focuses on, insights can be gained regarding which regions of the lungs are most indicative of COVID-19 infection.
3. **Collaboration with Experts**: Engaging with radiologists and healthcare professionals enriches the annotation process and aids in interpreting the model's outputs within a clinical context.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Future Plans
1. **Expand the Dataset**: Plan to collaborate with healthcare institutions to gather a more diverse and comprehensive dataset, including images from various stages of infection.
2. **Implement as a Web Application**: Develop a web-based tool (using frameworks like Streamlit) to make the detection model accessible to healthcare professionals in real time.
3. **Multimodal Diagnosis**: Integrate additional diagnostic data (such as patient symptoms and demographic information) to enhance the overall accuracy and robustness of the model.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
