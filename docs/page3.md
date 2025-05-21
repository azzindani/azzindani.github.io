---
layout: default
title: Lungs Abnormalities Detection
profile: false
headline: false
---

<a id="readme-top"></a>

[![Gmail](https://img.shields.io/badge/Gmail-D14836?logo=gmail&logoColor=white)](mailto:422indani@gmail.com)
[![LinkedIn](https://custom-icon-badges.demolab.com/badge/LinkedIn-0A66C2?logo=linkedin-white&logoColor=fff)](https://www.linkedin.com/in/azzindan1/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-121013?logo=github&logoColor=white)](https://azzindani.github.io/)
[![Hugging Face](https://img.shields.io/badge/Hugging%20Face-FFD21E?logo=huggingface&logoColor=000)](https://huggingface.co/Azzindani)
[![GitHub](https://img.shields.io/badge/GitHub-%23121011.svg?logo=github&logoColor=white)](https://github.com/azzindani)
---

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
    <li><a href="#real-world-use-cases">Real World Use Cases</a></li>
  </ol>
</details>

---
## Overview and Objective
This project, developed in **2021**, aims to utilize **computer vision and deep learning systems** to identify and analyze **abnormalities in lung images**, such as **chest X-rays (CXR) or CT scans**. By applying deep learning techniques to medical imaging data, the system seeks to assist **healthcare professionals in diagnosing conditions** such as **nodules, infiltrates, and other pulmonary abnormalities**. This tool serves as a foundation for more advanced diagnostic applications, including the potential for detecting **specific diseases**.

The objective of this project is to develop an **accurate and reliable computer vision model** capable of **detecting and classifying abnormalities in lung images**. This system will aid **radiologists in identifying various lung conditions**, providing an **early diagnostic tool** that can be expanded to encompass the detection of more specialized diseases in the future.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
## Motivation and Inspiration
**Early detection of lung abnormalities** is crucial for the effective treatment and management of various pulmonary diseases, such as **pneumonia, tuberculosis, and lung cancer**. **Timely diagnosis** can significantly improve treatment outcomes and enhance the chances of successful interventions. However, **manual examination of medical images** is often **time-consuming and prone to human error**, leading to delays in diagnosis and misinterpretations.

Inspired by the transformative potential of **AI to enhance diagnostic accuracy and efficiency**, this project harnesses **advanced computer vision techniques** to automate and streamline the detection process. By creating a sophisticated tool capable of **rapidly identifying abnormalities in chest X-rays and CT scans**, it aims to **alleviate some of the burdens faced by radiologists**.

This automated system is designed to serve as a **supportive assistant**, providing **initial assessments** that can expedite the review process and allow healthcare professionals to focus on more complex cases. By improving diagnostic efficiency, we hope to **enhance the overall workflow in radiology departments**, ultimately contributing to **better patient outcomes**. Additionally, this project has the potential to **reduce the burden on healthcare systems** by enabling **quicker identification and management of lung conditions**, particularly in settings with **high patient volumes or limited access to specialized medical expertise**.

Through this initiative, we aspire not only to improve **individual patient care** but also to advance the broader field of **medical imaging**, paving the way for further innovations in **AI-based healthcare solutions**.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
## Workflow
Below is the workflow on how my project works

<div align="center">
  <img src="/assets/page3/000.png" alt="Logo" width="1000">
</div>
<br>

1. Problem Definition
   - Clearly define the problem that needs to be solved.<br><br>

2. Finding Solutions
   - List all potential solutions and choose one to implement.  
   - Set objectives (e.g., classification accuracy, minimizing prediction errors) and constraints (e.g., time, hardware limitations).  
   - Create a plan outlining the expected outcomes.<br><br>

3. Data Collection
   - Gather and prepare a relevant dataset aligned with the problem.<br><br>

4. Data Preprocessing
   - Split the data into training, validation, and test sets.  
   - Perform labeling or annotation where necessary.<br><br>

5. Train & Test Model
   - Choose a deep learning model architecture based on the problem (e.g., CNN for images, RNN/LSTM for sequential data, Transformer for NLP).
   - Train the model, setting targets for accuracy, loss, and other performance metrics.  
   - Test the model using the test dataset to evaluate its performance.  
   - Conduct real-world testing with external datasets to ensure the model's accuracy and applicability.<br><br>

6. Evaluation & Improvement
   - Evaluate inputs, processes, outputs, and outcomes.  
   - Identify challenges.  
   - Discover insights.  
   - Make necessary improvements by addressing challenges, adding new features, or refining results based on evaluation feedback.  
   - Set a plan for future developments.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
## Solution and Technology Stack
Used tools:
1. TensorFlow Object Detection API
2. Pretrained Model
3. Python library : ![TensorFlow](https://img.shields.io/badge/TensorFlow-%23FF6F00.svg?style=for-the-badge&logo=TensorFlow&logoColor=white) ![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8.svg?style=for-the-badge&logo=opencv&logoColor=white) ![scikit-learn](https://img.shields.io/badge/scikit--learn-%23F7931E.svg?style=for-the-badge&logo=scikit-learn&logoColor=white) ![NumPy](https://img.shields.io/badge/numpy-%23013243.svg?style=for-the-badge&logo=numpy&logoColor=white) ![labelImg](https://img.shields.io/badge/labelImg-FF8800.svg?style=for-the-badge&logo=labelimg&logoColor=white)
4. Hardware : Laptop Acer Predator Helios 300, Intel-12700H, 48 GB Ram, Gen4 SSD, RTX3070Ti Laptop GPU, 8 GB Vram

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
## Project Details and Results
This project is trained to **detect lung abnormalities categorized into 8 conditions**: `Atelectasis`, `Infiltration`, `Pneumothorax`, `Effusion`, `Pneumonia`, `Cardiomegaly`, `Nodule`, and `Mass`.

1. Data Collection

   The dataset utilizing NIH Chest X-ray can be found at this [link](https://www.kaggle.com/datasets/nih-chest-xrays/data). I have used only **880 images** as a sample, limited to the number labeled by radiologists provided within the dataset.

2. Labelling

   Image labeling is done using the bounding box coordinates provided in this Excel file. I am unable to create further annotations and labels, as this needs to be performed by a qualified radiologist.

   <div align="center">
     <img src="/assets/page3/001.png" alt="Logo" width="1000">
   </div>
   <br>

3. Generate Training Records

   TFRecords generation in Python involves converting datasets, such as images and annotations, into a serialized binary format optimized for TensorFlow, enabling efficient data storage and access during model training and evaluation.

   ```sh
   import pathlib

   MAIN_PATH = str(pathlib.Path().resolve())
   WORKSPACE_PATH = MAIN_PATH + "\\workspace"
   SCRIPTS_PATH = MAIN_PATH + "\\scripts"
   ANNOTATION_PATH = WORKSPACE_PATH + "\\annotations"
   IMAGE_PATH = WORKSPACE_PATH + "\\images"
   TEST_PATH = IMAGE_PATH + "\\test"
   TRAIN_PATH = IMAGE_PATH + "\\train'"
   ```

   ```sh
   labels = [
       {"name" : "Atelectasis", "id" : 1},
       {"name" : "Cardiomegaly", "id" : 2},
       {"name" : "Effusion", "id" : 3},
       {"name" : "Infiltrate", "id" : 4},
       {"name" : "Mass", "id" : 5},
       {"name" : "Nodule", "id" : 6},
       {"name" : "Pneumonia", "id" : 7},
       {"name" : "Pneumothorax", "id" : 8}
   ]

   with open(ANNOTATION_PATH + "\label_map.pbtxt", "w") as f:
       for label in labels:
           f.write("item { \n")
           f.write("\tname:\"{}\"\n".format(label["name"]))
           f.write("\tid:{}\n".format(label["id"]))
           f.write("}\n")
   ```
   
   ```sh
   !python {MAIN_PATH + "\\00_Gen_Tfrecord.py"} --csv_input={ANNOTATION_PATH + "\\train_list.csv"} --image_dir={TRAIN_PATH} --output_path={ANNOTATION_PATH + "\\train.record"}
   !python {MAIN_PATH + "\\00_Gen_Tfrecord.py"} --csv_input={ANNOTATION_PATH + "\\test_list.csv"} --image_dir={TEST_PATH} --output_path={ANNOTATION_PATH + "\\test.record"}
   ```
   <br>
   
   <div align="center">
     <img src="/assets/page3/002.png" alt="Logo" width="1000">
   </div>
   <br>

4. Training Model using TensorFlow OD API
   - The TensorFlow object detection API was downloaded from this repository: [TensorFlow Models](https://github.com/tensorflow/models/tree/master/research/object_detection).
   - The pre-trained models were downloaded from this repository: [TF2 Detection Model Zoo](https://github.com/tensorflow/models/blob/master/research/object_detection/g3doc/tf2_detection_zoo.md).
   
   In this section, the dataset was trained to detect lungs as an object, and the trained model was saved by following these steps:
   - Generate the training command using this code.
     
     ```sh
      APIMODEL_PATH = "\\TensorFlow\\models" # set up your own path
      WORKSPACE_PATH = MAIN_PATH + "\\workspace"
      MODEL_PATH =  WORKSPACE_PATH + "\\models"
      CUSTOM_MODEL_NAME = "my_ssd_mobnet" # used pre-trained model
      n = 5000
      ```
      
      ```sh
      print("""python {}\\research\\object_detection\\model_main_tf2.py --model_dir={}\\{} --pipeline_config_path={}\\{}\\pipeline.config --num_train_steps={}""".format(APIMODEL_PATH, MODEL_PATH, CUSTOM_MODEL_NAME, MODEL_PATH, CUSTOM_MODEL_NAME, n))
      ```
   
    - Copy and paste the training command into the command prompt, then press enter to start the training process.
      
      <div align="center">
        <img src="/assets/page3/003.png" alt="Logo" width="1000">
      </div>
      <br>
     
   - Training process

     <div align="center">
       <img src="/assets/page3/004.png" alt="Logo" width="1000">
     </div>
     <br>
     
   - Once training is complete, you can check the trained model as shown below. This model can be used to perform various detection tasks.

     <div align="center">
       <img src="/assets/page3/005.png" alt="Logo" width="1000">
     </div>
     <br>

5. Detection Test

   The actual testing will use images different from those used in training. In this step, the code will attempt to detect 1,000 images, generating bounding boxes, labels, and detection scores on the images. You can review the detection results below.
   
   <div align="center">
     <img src="/assets/page3/006.png" alt="Logo" width="1000">
     <img src="/assets/page3/007.png" alt="Logo" width="1000">
     <img src="/assets/page3/008.png" alt="Logo" width="1000">
     <img src="/assets/page3/009.png" alt="Logo" width="1000">
     <img src="/assets/page3/010.png" alt="Logo" width="1000">
     <img src="/assets/page3/011.png" alt="Logo" width="1000">
   </div>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
## Challenges
1. **Data Quality and Annotation**: Obtaining a diverse dataset of labeled lung images with clear annotations of abnormalities poses a challenge due to the need for medical input from experts. High-quality annotations from radiologists are essential for effectively training deep learning models. The scarcity of annotated datasets can limit the model's ability to generalize across various populations and conditions. Furthermore, ensuring that the data represents diverse demographics, disease stages, and imaging modalities complicates the data collection process.
2. **Inconsistency in Annotations**: Variability in interpretation among different experts can lead to inconsistencies in labeling, impacting model training.
3. **Variability in Imaging Conditions**: Differences in image quality, patient positioning, and equipment can significantly affect model performance. Variations in imaging protocols, such as exposure settings and types of scanners used, can introduce inconsistencies that hinder the model's ability to achieve reliable accuracy. This variability necessitates the development of robust preprocessing techniques to standardize images before analysis, adding complexity to workflows and requiring careful calibration.
4. **Differences in Equipment**: The use of different imaging devices (e.g., various brands and models of X-ray machines) can result in substantial differences in image quality.
5. **Detection Accuracy**: Achieving high precision in identifying various types of abnormalities while minimizing false positives and false negatives is a critical challenge. False positives can lead to unnecessary anxiety and additional testing for patients, while false negatives can result in missed diagnoses and delayed treatments. Striking the right balance between sensitivity and specificity is vital, often requiring extensive experimentation and model refinement to optimize performance across different conditions.
6. **Complexity of Abnormalities**: Some abnormalities may present overlapping features, making them difficult to distinguish without extensive training data.
7. **Real-Time Processing Requirements**: Achieving accurate detection quickly enough for clinical use presents an additional challenge in computational efficiency.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
## Insights
1. **Model Adaptability**: The techniques used to detect lung abnormalities can be adapted for other medical imaging tasks, such as identifying abnormalities in various organs.
2. **Cross-Domain Applications**: Techniques developed for detecting lung abnormalities can also be applied to other imaging modalities, such as MRI or ultrasound, thereby broadening the technology's scope.
3. **Transfer Learning Opportunities**: Pre-trained models can be fine-tuned for various medical imaging tasks, reducing the time and data required for new applications.
4. **Importance of Preprocessing**: Effective image preprocessing and normalization are crucial for enhancing model accuracy and addressing variations in imaging conditions.
5. **Input Standardization**: Implementing consistent preprocessing protocols helps ensure that images can be compared, improving the model's robustness across different datasets.
6. **Noise Reduction Techniques**: Advanced noise reduction methods can enhance image quality, leading to better model performance, especially in low-quality or poorly captured images.
7. **Expert Collaboration**: Collaborating with radiologists provides valuable insights into the features and patterns indicative of various pulmonary abnormalities, enhancing the model's relevance and utility.
8. **Insights on Feature Importance**: Radiologists can help identify critical imaging features to prioritize in the training process, resulting in a more clinically relevant model.
9. **Diagnostic Support**: The model can serve as a complementary tool for radiologists, providing a second opinion and highlighting areas of concern that may warrant further investigation.
10. **Workflow Efficiency Improvement**: By automating initial assessments, the model can assist radiologists in prioritizing cases requiring immediate attention, thereby enhancing overall workflow efficiency.
11. **Reduction of Diagnostic Errors**: Serving as a complementary tool can help identify subtle abnormalities that may be missed during manual reviews, thereby reducing the risk of diagnostic errors.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
## Future Plans
1. **Expand Disease Detection**: Broaden the model's capabilities to identify and classify additional lung conditions and abnormalities, such as specific infections or cancers.
2. **Multi-Organ Abnormality Detection**: Enhance the model's ability to detect abnormalities in other organs, creating a comprehensive diagnostic tool for various medical conditions.
3. **Develop a User-Friendly Interface**: Create a web-based platform or application where healthcare professionals can upload and analyze lung images in real time.
4. **Customizable Features**: Provide tailored settings for analysis based on specific needs, such as adjusting sensitivity levels or selecting different imaging protocols.
5. **Integrate Advanced Techniques**: Explore the use of advanced deep learning techniques, such as segmentation networks and attention mechanisms, to improve detection accuracy and detail.
6. **Ensemble Learning Approach**: Investigate ensemble methods that combine predictions from multiple models to enhance overall detection accuracy and robustness.
7. **Explainable AI**: Develop mechanisms for model interpretability, allowing users to understand the rationale behind specific detection results, thereby building trust in AI-generated outcomes.
8. **Integrate with Clinical Systems**: Aim to integrate the detection system with hospital information systems and imaging platforms to facilitate smooth clinical adoption.
9. **Compliance with Interoperability Standards**: Ensure that the detection system adheres to interoperability standards (e.g., HL7, DICOM) to enable easy integration with existing clinical workflows.
10. **Real-Time Reporting Capabilities**: Implement features that allow for the real-time reporting of findings directly within clinical systems.
11. **Continuous Improvement**: Regularly update and refine the model based on new data and feedback from clinical use to maintain high performance and relevance.
12. **Feedback Mechanism**: Establish structured channels for healthcare professionals to provide feedback on the model's performance, which can inform ongoing improvements.
13. **Adaptive Learning**: Implement adaptive learning techniques that enable the model to automatically learn from new cases and anomalies, ensuring it remains up to date with evolving medical knowledge.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
## Real World Use Cases
1. **Assisting Radiologists in Early Detection:** This AI-driven tool acts as a supportive assistant by rapidly highlighting potential lung abnormalities in chest X-rays and CT scans, allowing radiologists to prioritize cases that require urgent attention and improve diagnostic accuracy.
2. **Enhancing Diagnostic Efficiency in High-Volume Settings:** By automating the initial screening of lung images, the system reduces workload and turnaround times in busy radiology departments, enabling faster patient triage and more timely interventions.
3. **Expanding Access in Resource-Limited Areas:** Integrated into portable or telemedicine platforms, this technology empowers healthcare providers in regions with limited specialist availability to identify lung conditions early, bridging gaps in healthcare accessibility.
4. **Complementing, Not Replacing, Human Expertise:** Serving as an augmentative technology, the system provides preliminary assessments that support, rather than substitute, the critical judgment and experience of medical professionals.
5. **Foundation for Broader AI-Driven Medical Imaging Solutions:** This project lays the groundwork for future development of AI tools capable of detecting a wide range of pulmonary diseases and abnormalities, helping to advance personalized and scalable healthcare worldwide.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
