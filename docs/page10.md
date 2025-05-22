---
layout: default
title: Broker Transaction Automation System
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
This project integrates the entire workflow of **scraping and analyzing broker transaction data** from stock exchanges into a **semi-automated end-to-end system**. The system automatically scrapes broker transaction data on a **daily or weekly basis**, stores it in a **centralized SQL server**, and updates an **interactive data analysis dashboard** for near real-time visualization.

By combining data collection, storage, and analysis into a single pipeline, the system delivers **continuous, up-to-date insights** into broker activities and market trends—**minimizing manual intervention**. The end goal is to enable **ongoing data monitoring** and provide **timely insights** to support strategic decision-making for traders, investors, and financial analysts.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
## Motivation and Inspiration
As financial markets evolve rapidly, relying on outdated or static data limits the ability to act effectively. The motivation behind this project is driven by the **need for continuous updates**, improved automation, and **faster access to reliable insights**.

Previously, data collection and analysis were performed separately, requiring significant manual effort and causing delays in insight generation. To overcome these inefficiencies, this project was initiated to build a **dynamic and self-updating system** that provides **real-time visibility** into broker behavior.

By automating the full workflow—from data scraping to dashboard updates—the project supports an **agile and proactive approach** to market analysis, allowing users to **stay ahead of trends** and make **more informed investment decisions**.

**Project Reference**
- [Broker Transaction Data Scraping](https://azzindani.github.io/docs/page8.html)
- [Broker Transaction Data Analysis](https://azzindani.github.io/docs/page9.html)
  
<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
## Workflow
Below is the workflow on how my project works

<div align="center">
  <img src="/assets/page10/000.png" alt="Logo" width="1000">
</div>
<br>

1. Problem Definition
   - Clearly define the problem that needs to be solved.<br><br>

2. Finding Solution
   - List all potential solutions and choose one for implementation.  
   - Develop a plan outlining the expected outcomes.<br><br>

3. Data Collection
   - Gather and prepare relevant datasets aligned with the problem.  
   - If batch datasets are unavailable, develop a data collection process such as web scraping.  
   - Ensure data quality and resolve any data issues.<br><br>

4. Data Preprocessing
   - Handle missing data or outliers.  
   - Clean and structure the data.  
   - Perform data transformation.  
   - Store data appropriately.  
   - Backup the data.<br><br>

5. Continuous Update
   - Regularly update the dataset or as needed.<br><br>

6. Data Visualization & Analysis
   - Univariate analysis - (numerical data): Use histograms, box plots, and density plots to understand distributions.  
   - Univariate analysis - (categorical data): Use bar charts or pie charts to observe category frequencies.  
   - Bivariate analysis: Analyze relationships between two variables.  
   - Multivariate analysis: Examine interactions between three or more variables, often visualized with pair plots or heatmaps.<br><br>

7. Evaluation & Improvement
   - Evaluate inputs, processes, outputs, and outcomes.  
   - Identify challenges.  
   - Gain insights.  
   - Implement necessary improvements by addressing challenges, adding new features, or refining results based on evaluation feedback.  
   - Develop a plan for future enhancements.
     
<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
## Solution and Technology Stack
Used tools:
1. Python library : ![Selenium](https://img.shields.io/badge/selenium-43B02A.svg?style=for-the-badge&logo=selenium&logoColor=white) ![Pandas](https://img.shields.io/badge/pandas-%23150458.svg?style=for-the-badge&logo=pandas&logoColor=white) ![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) ![Psycopg](https://img.shields.io/badge/psycopg-2F6792.svg?style=for-the-badge&logo=postgresql&logoColor=white) ![Plotly](https://img.shields.io/badge/Plotly-%233F4F75.svg?style=for-the-badge&logo=plotly&logoColor=white) ![Streamlit](https://img.shields.io/badge/streamlit-FF4B4B.svg?style=for-the-badge&logo=streamlit&logoColor=white)
2. Hardware : Laptop Acer Predator Helios 300, Intel-12700H, 48 GB Ram, Gen4 SSD, RTX3070Ti Laptop GPU, 8 GB Vram

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
## Project Details and Results
1. Data Collection
   
   The data collection program, **developed with 10 integrated bots**, automatically updates ticker data, checks for data completeness, and re-collects incomplete data. The program can be scheduled to run on specific dates, weekly updates, or daily updates. Currently, I am using only 5 bots to reduce the workload on my computer. These bots are capable of collecting data for **over 900 companies in just 50 minutes each day**.
   - Collection process
     
     <div align="center">
       <img src="/assets/page10/001.png" alt="Logo" width="1000">
       <img src="/assets/page10/002.png" alt="Logo" width="1000">
       <img src="/assets/page10/003.png" alt="Logo" width="1000">
     </div>
     <br>
     
   - Completion check
     
     <div align="center">
       <img src="/assets/page10/004.png" alt="Logo" width="1000">
     </div>
     <br>
     
   - Recollection process
     
     <div align="center">
       <img src="/assets/page10/005.png" alt="Logo" width="1000">
     </div>
     <br>

2. Data Process

   In this step, the program will **execute the ETL process (Extract, Transform, Load)**, including backing up raw data. The process involves extracting information from raw data, transforming it into numerical data, reformatting the data frame, merging all data, then uploading it to my SQL server, and followed by backing up the raw data.
   - Data conversion by leveraging multiprocessing
     
     <div align="center">
       <img src="/assets/page10/006.png" alt="Logo" width="1000">
     </div>
     <br>
     
   - Uploading dataset to SQL server
     
     <div align="center">
       <img src="/assets/page10/007.png" alt="Logo" width="1000">
     </div>
     <br>
     
   - Result & preview
     
     <div align="center">
       <img src="/assets/page10/008.png" alt="Logo" width="1000">
     </div>
     
   - Back up dataset as raw files
     
     <div align="center">
       <img src="/assets/page10/009.png" alt="Logo" width="1000">
     </div>
     <br>

3. Data Visualization

   Data visualization is created using Plotly and Streamlit for interactive dashboards, capable of querying datasets from the SQL server, processing calculations based on predefined functions, and then visualizing the data.
   
   <div align="center">
     <img src="/assets/page10/010.png" alt="Logo" width="1000">
     <img src="/assets/page10/011.png" alt="Logo" width="1000">
     <img src="/assets/page10/012.png" alt="Logo" width="1000">
     <img src="/assets/page10/013.png" alt="Logo" width="1000">
   </div>
   <br>

**Notes:**

**This project has the potential to be developed into a fully automated system by deploying the program to a hosting server that operates 24/7. However, at the moment, I don't have the necessary equipment to build a server for running the bots and hosting the interactive dashboard as a web application.**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
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

---
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

---
## Future Plans
1. **Advanced Monitoring & Alerts:** Implementing an alert system that notifies users of significant changes in broker activity or market trends as detected by the automated system.
2. **Custom Scheduling Options:** Offering flexible scheduling options that allow users to adjust scraping intervals based on market conditions or specific needs, such as intraday data collection.
3. **Cloud Integration:** Expanding the system's capabilities to integrate with cloud platforms, ensuring data access and dashboard updates from anywhere, enhancing team collaboration.
4. **Enhanced Security & Compliance:** Strengthening the security of the automated system to protect data scraping processes, SQL servers, and dashboards from unauthorized access or breaches.
5. **Machine Learning Enhancements:** Integrating machine learning models to uncover deeper patterns in broker transactions and automate predictions based on both new and historical data.
6. **AI-Driven Insights:** Developing AI-based analytical tools to automatically identify significant market events, such as sudden changes in trading volumes or price movements influenced by specific brokers.
7. **Natural Language Processing (NLP):** Leveraging NLP techniques to analyze accompanying text data, such as news articles or broker commentary, to assess sentiment and its impact on trading.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---
## Real World Use Cases
1. **Daily Trading Signal Generation for Retail Investors:** With automatic updates of broker activities fed into a live dashboard, retail investors can receive **daily or weekly actionable signals**, such as detecting sudden entry of institutional brokers or consistent accumulation phases, empowering them to make timely buy/sell decisions without manual data tracking.
2. **Automated Investment Research for Analysts:** Financial analysts working in research firms or fintech startups can rely on the **semi-automated pipeline** to continuously feed structured broker data into their models, enabling **real-time tracking of market sentiment** and broker behavior without spending time on repetitive data collection tasks.
3. **Smart Alerts for Portfolio Monitoring:** Portfolio managers and algorithmic traders can use the system to set **threshold-based alerts** that notify them when specific brokers become active in a stock or sector they follow. This can lead to **faster response times** and **data-driven rebalancing decisions**.
4. **Market Intelligence Reports for Advisory Firms:** Investment advisors can leverage the continuously updated insights from the dashboard to prepare **weekly or monthly reports** for clients, highlighting key broker movements, foreign versus local investor trends, and market anomalies—without needing to manually prepare data.
5. **Algorithmic Trading Strategy Integration:** Quantitative traders can integrate the broker behavior database with their trading algorithms, using broker movement trends as **dynamic input features** in machine learning models, supporting strategies like momentum tracking or smart money tracing.
6. **Behavioral Pattern Tracking for Regulatory Oversight:** Regulatory institutions or market surveillance teams can use the system to **monitor brokers for unusual or suspicious activity patterns** in near real-time, making compliance and enforcement efforts more efficient.
7. **Educational Tools for Financial Literacy Programs:** The live dashboard can serve as a **real-world teaching interface** in investment or finance training programs, allowing students to observe how broker behavior unfolds over time and how it correlates with price action.
8. **SaaS Product Foundation for Market Analytics:** This project can serve as the backend infrastructure for building a **Software-as-a-Service (SaaS) product** focused on retail traders, offering premium broker insight tools on a subscription basis, and replacing expensive data platforms.
9. **Event-Based Market Reaction Studies:** The continuous data pipeline allows researchers to quickly study how brokers react to **corporate actions, earnings releases, or macroeconomic events**, by comparing broker behavior before and after events without waiting for manual data compilation.
10. **Custom Dashboard for Institutional Clients:** The system can be extended to build **custom dashboards for hedge funds or asset managers**, giving them personalized views on selected stocks, broker segments, or regional trading patterns, with automatic updates that reduce research lag.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
