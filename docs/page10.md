---
layout: default
title: Broker Transaction Automation System
profile: false
headline: false
---

<a id="readme-top"></a>

# Broker Transaction Automation System

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
This project integrates the entire workflow of scraping and analyzing broker transaction data from stock market exchanges into an semi-automated end-to-end system. The system automates the scraping of broker transaction data on a daily or weekly basis, uploads it to an SQL server, and updates a data analysis dashboard for near real-time visualization. By combining both scraping and analysis processes into one seamless pipeline, the project provides continuous, up-to-date insights into broker activities and market trends, nearly eliminate the need for manual intervention. The end goal is to enable continuous data monitoring, with insights readily available to support timely decision-making for traders, investors, and financial analysts.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Motivation and Inspiration
The need of continuous updates and improvements.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Workflow
Below is the workflow on how my project works

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Solution and Technology Stack
Used tools:
1. Python library : Pandas, PostgreSQL, Psycopg, Plotly, Streamlit
2. Hardware : Laptop Acer Predator Helios 300, Intel-12700H, 48 GB Ram, Gen4 SSD, RTX3070Ti Laptop GPU, 8 GB Vram

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Project Details and Results
1. Data Collection
The data collection program, developed with 10 integrated bots, automatically updates ticker data, checks for data completeness, and re-collects incomplete data. The program can be scheduled to run on specific dates, weekly updates, or daily updates. Currently, I am using only 5 bots to reduce the workload on my computer. These bots are capable of collecting data for over 900 companies in just 50 minutes each day.

3. Data Process
In this step, the program will execute the ETL process (Extract, Transform, Load), including backing up raw data. The process involves extracting information from raw data, transforming it into numerical data, reformatting the data frame, merging all data, then uploading it to my SQL server, and followed by backing up the raw data.

2. Data Visualization
Data visualization is created using Plotly and Streamlit for interactive dashboards, capable of querying datasets from the SQL server, processing calculations based on predefined functions, and then visualizing the data.

Notes:
This project has the potential to be developed into a fully automated system by deploying the program to a hosting server that operates 24/7. However, at the moment, I don't have the necessary equipment to build a server for running the bots and hosting the interactive dashboard as a web application.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Challenges
1. **Scheduling and Performance:** Ensuring that data scraping and processing tasks run efficiently and effectively.
2. **Scalability Challenges:** As data volume and sources grow, the scheduling system must scale accordingly. This can be challenging when faced with limited resources or high-frequency data requirements.
3. **Concurrency Management:** Handling multiple scraping tasks simultaneously while avoiding race conditions and ensuring data integrity during parallel operations.
4. **Network Latency Handling:** Addressing network latency issues that can cause delays in data uploads, impacting the timeliness of data availability for analysis.
5. **Conflict Resolution:** Developing robust mechanisms to resolve conflicts and ensure consistency when various sources provide overlapping or conflicting data updates.
6. **Data Backup and Recovery:** Implementing efficient backup and recovery processes to prevent data loss or corruption during synchronization failures or server downtime.
7. **Automation Reliability:** Ensuring that automated workflows are resilient to website structure changes, errors, or disruptions in scraping and analysis.
8. **Dynamic Dashboard Updates:** Guaranteeing that data analysis dashboards can be dynamically updated with new data without manual refreshes, automatically reflecting the latest insights.
9. **Data Storage and Query Optimization:** Implementing data storage strategies and optimizing queries to ensure dashboards remain responsive, even with frequent updates and large datasets.
10. **Visualization Scalability:** Ensuring that visualizations and analytics scale seamlessly with growing data volumes, preventing performance degradation as datasets expand.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Insights
1. **Seamless Data Flow:** Automating the entire process, from data scraping to visualization, ensures an uninterrupted flow of information, delivering fresh insights as soon as new transactions occur.
2. **Reduced Manual Intervention:** Automating the entire workflow minimizes the need for manual data handling, reduces errors, and frees up resources for more complex analytical tasks.
3. **Parallel Processing:** Multiprocessing enables launching multiple browser instances simultaneously, each performing independent scraping tasks. This parallelism significantly reduces overall execution time, especially when tasks involve large-scale data downloads.
4. **CPU and Memory Utilization:** Running multiple Selenium instances can be resource-intensive. Efficient use of CPU cores and memory is crucial to ensure that the system can handle multiple browser instances without significant performance degradation.
5. **Limiting Browser Instances:** Controlling the number of concurrent browser instances to match available CPU cores prevents overload and ensures optimal performance.
6. **Browser and WebDriver Compatibility:** Ensuring compatibility between the browser version and the corresponding WebDriver is essential. Version mismatches can lead to unexpected failures.
7. **Headless Mode:** Using headless mode (without a GUI) can significantly reduce resource usage. However, some websites behave differently in headless mode, requiring thorough testing.
8. **End-to-End Integration:** Integrating various stages of data processing, from extraction to analysis, ensures that data remains consistent and reliable throughout the workflow.
9. **Instant Market Response:** With real-time data, users can quickly react to sudden market changes, such as significant trades by influential brokers, enhancing their ability to seize opportunities or mitigate risks.
10. **Scalability:** The system is highly scalable, capable of handling growing datasets and integrating additional sources or new data points with minimal adjustments.
11. **Efficient Data Management:** Storing scraped data on an SQL server ensures efficient data retrieval, storage, and query execution, facilitating the analysis of historical trends alongside real-time data.
12. **Advanced Query Capabilities:** Leveraging advanced SQL query techniques enables users to conduct complex analyses, such as identifying correlations between broker behavior and stock performance over time.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Future Plans
1. **Advanced Monitoring & Alerts:** Implementing an alert system that notifies users of significant changes in broker activity or market trends as detected by the automated system.
2. **Custom Scheduling Options:** Offering flexible scheduling options that allow users to adjust scraping intervals based on market conditions or specific needs, such as intraday data collection.
3. **Cloud Integration:** Expanding the system's capabilities to integrate with cloud platforms, ensuring data access and dashboard updates from anywhere, enhancing team collaboration.
4. **Enhanced Security & Compliance:** Strengthening the security of the automated system to protect data scraping processes, SQL servers, and dashboards from unauthorized access or breaches.
5. **Machine Learning Enhancements:** Integrating machine learning models to uncover deeper patterns in broker transactions and automate predictions based on both new and historical data.
6. **AI-Driven Insights:** Developing AI-based analytical tools to automatically identify significant market events, such as sudden changes in trading volumes or price movements influenced by specific brokers.
7. **Natural Language Processing (NLP):** Leveraging NLP techniques to analyze accompanying text data, such as news articles or broker commentary, to assess sentiment and its impact on trading.

<p align="right">(<a href="#readme-top">back to top</a>)</p>