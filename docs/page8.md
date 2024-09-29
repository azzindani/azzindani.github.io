---
layout: default
title: Broker Transaction Data Scraping
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
This project developed in 2021, aims to create a web scraping system that automates the extraction of broker transaction data from the stock exchange. The system will gather detailed transaction records from brokers, including trading volume, buy and sell orders, and other relevant information. By collecting this data, the system will provide valuable insights into broker behavior and its impact on market dynamics. This tool will serve as a crucial resource for investors, analysts, and researchers seeking to understand market trends and broker activities.

The goal of this project is to build a scalable web scraping system capable of automatically collecting broker transaction data. This data will be structured and organized for analysis, enabling users to gain insights into broker behavior, transaction patterns, and market trends. The project's scope is limited to data collection for building a retrospective database.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Motivation and Inspiration
I have experience investing in the Indonesian stock market. One of the main challenges in trading and investing in this market is that predicting stock prices cannot be solely based on technical or fundamental analysis. To address this issue, I sought out alternative methods and came across a book titled Bandarmology by Ryan Filbert. This book introduced me to a unique investment approach known as bandarmology—which translates to brokermology in English. This method involves observing broker transactions (buy/sell) for specific stocks, offering a different perspective on the stock market. Brokers can represent any segment of investors, such as local or foreign, retail investors or hedge funds.

<div align="center">
  <img src="/assets/page8/001.png" alt="Logo" width="1000">
</div>

Simultaneously, I realized the importance of learning how to gather large datasets from the internet. Broker transaction data is one of the few datasets shared publicly for transparency. However, collecting this data manually from the stock exchange can be inefficient, time-consuming, and exhausting, as it is presented in HTML tables instead of exportable files. The inspiration behind this project stemmed from the need to automate the process of collecting broker transaction data, providing a comprehensive and efficient way to track and analyze broker activities. By making this data more accessible, the project aims to support more informed investment decisions and market analysis.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Workflow
Below is the workflow on how my project works

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Solution and Technology Stack
Used tools:
1. Python library : Selenium, Pandas
2. Hardware : Laptop Acer Predator Helios 300, Intel-12700H, 48 GB Ram, Gen4 SSD, RTX3070Ti Laptop GPU, 8 GB Vram

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Project Details and Results
1. Data Collection Automation
   There is a platform that provides daily broker transaction data, which I use for data mining. Previously, I employed a multi-threaded bot setup with 20 bots running simultaneously to gather data. However, due to platform limitations and website designe changes, I currently use a 10 bots for data extraction. While I won't be sharing screenshots of my code for various reasons, I am happy to showcase the results. The primary goal of this bot is to collect and extract tabular transaction data from HTML and save it as CSV files.

   <div align="center">
     <img src="/assets/page8/002.png" alt="Logo" width="1000">
   </div>

   To date, I have gathered approximately 1 million plus of CSV files using my bot, which has been mining transaction data since 2017.
   
   <div align="center">
     <img src="/assets/page8/003.png" alt="Logo" width="1000">
   </div>

2. Completion Data Check
   - Identifying Missing Files: Locating any files that were not downloaded successfully.
     
     <div align="center">
       <img src="/assets/page8/004.png" alt="Logo" width="1000">
     </div>
     
   - Verifying File Content: Checking whether the CSV files contain transaction data, as there are instances where my bot fails to write data correctly (possibly due to an error).
     
     <div align="center">
       <img src="/assets/page8/005.png" alt="Logo" width="1000">
     </div>
     
   - Detecting Empty Files: Identifying empty CSV files by inspecting their file sizes.
     
     <div align="center">
       <img src="/assets/page8/006.png" alt="Logo" width="1000">
     </div>

3. Data Validation
   - Collect Original Summary Data: Retrieve the original summary data from my broker platform for comparison.
     
     <div align="center">
       <img src="/assets/page8/007.png" alt="Logo" width="1000">
     </div>
     
   - Summarize Daily Transaction Data: Aggregate all daily transaction data through an extensive calculation process.
     
     <div align="center">
       <img src="/assets/page8/008.png" alt="Logo" width="1000">
     </div>
     
   - Identify Data Discrepancies: Compare the summary data to identify and correct any data errors.
     
     <div align="center">
       <img src="/assets/page8/009.png" alt="Logo" width="1000">
       <img src="/assets/page8/010.png" alt="Logo" width="1000">
     </div>

4. Recollecting Data to be Revised
   - Manual Data Analysis: Manually analyze the compared transaction summary data in Excel, using it as a reference for refining the bot.
     
     <div align="center">
       <img src="/assets/page8/011.png" alt="Logo" width="1000">
     </div>
     
   - Re-running the Bot: Run the bot to re-collect data, where it will scan for files smaller than 40 bytes and automate the re-download process.
     
     <div align="center">
       <img src="/assets/page8/012.png" alt="Logo" width="1000">
       <img src="/assets/page8/013.png" alt="Logo" width="1000">
     </div>
     
   - Iterative Refinement: Repeat this process, comparing results each time to minimize data discrepancies and achieve the lowest margin of error.

     <div align="center">
       <img src="/assets/page8/014.png" alt="Logo" width="1000">
     </div>

## Challenges
1. **Data Volume and Frequency:** Broker transactions are vast and frequent, posing challenges in efficiently collecting, processing, and storing large volumes of data.
2. **Data Quality:** Ensuring that the collected data is accurate, complete, and consistent.
3. **Website Changes:** Adapting to changes in website structure and data formats, which can impact the data collection process and require ongoing maintenance.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Insights
1. **Real-Time Monitoring:** Collecting broker transaction data in near real-time provides valuable insights into market sentiment and trading trends as they unfold.
2. **Predictive Analytics:** Continuous data collection supports the development of predictive models that forecast short-term market movements based on broker activity patterns.
3. **Market Behavior Insights:** By gathering broker-specific transaction data, analysts can gain a deeper understanding of how certain brokers influence price movements and trading volumes.
4. **Data Enrichment:** Automated processes can enhance collected data by integrating additional information, such as stock fundamentals or news sentiment, providing a more comprehensive view for analysis.
5. **Automated Data Processing:** Integrating automated data cleaning and organization processes ensures that collected data is ready for analysis, minimizing the need for manual intervention.
6. **Scalability and Efficiency:** Automated data flows ensure scalability, allowing the system to efficiently handle large volumes of data from various sources without manual input.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Future Plans
1. **Expanding Data Coverage:** Enhance the scraping system to include additional global exchanges and related financial data, providing a more comprehensive dataset for analysis.
2. **Incorporating Alternative Data Sources:** Include data from social media, financial news, and sentiment analysis to enrich the dataset and provide context for broker transactions.
3. **Adding Historical Data:** Implement mechanisms to scrape and archive historical transaction data, enabling longitudinal analysis and trend identification over time.
4. **Expanding Asset Classes:** Broaden the scope to include transactions related to various asset classes, such as derivatives, commodities, and cryptocurrencies, allowing for a more holistic view of market behavior.
5. **Enhancing Real-Time Capabilities:** Develop systems for real-time scraping and processing, enabling timely analysis of current broker transactions.
6. **Interactive Dashboards:** Create interactive dashboards that allow users to filter and explore specific broker transactions, providing deeper insights and customized views.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
