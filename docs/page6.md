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
This project aims to develop a web scraping system designed to extract a diverse range of financial data from the Indonesian stock exchange database. The system will collect financial reports, supporting documents, Excel tables, and XBRL files. By automating the extraction process, this project seeks to provide a comprehensive dataset for financial analysis, research, and reporting, making it easier to access and analyze essential financial information.

The primary goal of this project is to build a robust web scraping system capable of automatically gathering and organizing financial data using multi-threading or multiprocessing techniques. While the main focus is on creating a comprehensive dataset, the project’s current scope is limited to data collection only.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Motivation and Inspiration
I am passionate about financial markets and want to start my journey by exploring the stock exchange, as it offers transparency and easily accessible documentation. I’ve noticed that while some media sources provide summarized information, access to more extensive historical datasets is often limited and requires a subscription for deeper insights. Since I am unable to afford such subscriptions, I need to develop a bot to collect financial data.

Accessing financial data from stock exchange databases can be time-consuming and labor-intensive if done manually. Inspired by the need for efficient data retrieval, this project focuses on automating the web scraping process to swiftly gather detailed financial information. The goal is to streamline financial research, enhance data accessibility, and support informed decision-making.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Workflow
Below is the workflow on how my project works

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Solution and Technology Stack
Used tools:
1. Python library : Selenium
2. Hardware : Laptop Acer Predator Helios 300, Intel-12700H, 48 GB Ram, Gen4 SSD, RTX3070Ti Laptop GPU, 8 GB Vram

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Project Details and Results
1. Data Collection Automation
a. When I first developed this bot, I started with a single instance, facing the challenge of slow data mining. The bot performed a series of tasks, including launching Chromedriver, navigating to the website (https://www.idx.co.id/id/perusahaan-tercatat/laporan-keuangan-dan-tahunan), entering keywords into the search tab, selecting the year and quarter, clicking “search”/“apply,” downloading files, and saving them in a temporary directory. The final step involved renaming the file from the temporary path and moving it to a new location with an organized folder structure.
b. In the second approach, I created a multi-threaded bot capable of generating 10 bots simultaneously, each handling a different task. This setup allowed me to gather over 10,000 files annually, significantly enhancing efficiency and productivity.
c. As you may know, the website only provides data from the last 5 years. However, I was fortunate to extract financial reports dating back to 2015 by employing an HTML injection script. Unfortunately, this method is no longer feasible.

3. Files Check
After downloading all the financial report documents, I need to verify the bot's performance to ensure completeness and accuracy.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Challenges
1. **Data Collection Speed:** Data collection was initially slow due to using only a single bot. Therefore, I developed a multi-threading bot capable of running simultaneously to increase efficiency.
2. **Network Constraints:** Network limitations can affect data quality and potentially cause system crashes. To mitigate this, I need to limit the number of bots running concurrently.
3. **Handling Pop-Up Messages:** Occasionally, pop-ups appear during the process, which needs to be managed effectively.
4. **Data Quality:** Ensuring the accuracy and completeness of the scraped data, and addressing inconsistencies or errors in source documents.
5. **Website Changes:** Adapting to changes in website structure and data formats, which can impact the scraping process and require continuous maintenance.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Insights
1. **Parallel Exploration:** Multiprocessing enables the launch of multiple browser instances simultaneously, each performing independent scraping tasks. This parallelism can significantly reduce overall execution time, especially when tasks involve loading multiple web pages or downloading large volumes of data.
2. **Browser Instance Management:** Controlling the number of concurrent browser instances to match the available CPU cores prevents overloading and ensures optimal performance.
3. **Driver Configuration:** Carefully configure each WebDriver instance, including options such as headless mode, to reduce visual load and save resources.
4. **Task Allocation:** Distribute data or tasks evenly across processes. For example, each process can handle a portion of URLs or a range of search keywords. Proper workload balancing prevents some processes from finishing too quickly while others lag behind.
5. **Shared Data Handling:** If data needs to be shared among processes, use multiprocessing queues or shared memory constructs. Avoid using global variables, as they are not shared across processes.
6. **Failure Management:** Websites may block or limit requests if bot-like behavior is detected. Implementing try-except blocks and setting up automatic retries for failed requests can help ensure resilience.
7. **WebDriver Timeouts:** Set appropriate timeouts for WebDriver operations to prevent processes from hanging indefinitely due to slow-loading pages or network issues.
8. **Browser and WebDriver Compatibility:** Ensure compatibility between the browser and the corresponding WebDriver versions. Version mismatches can lead to unexpected failures.
9. **Scalability:** Designing the system to handle large volumes of data and support scalability will ensure its effectiveness as data needs grow.
10. **Open Data Sources:** Public companies often provide open datasets containing valuable insights about activities, strategies, financials, and more. Leveraging these sources can enrich the analytical capabilities of the system.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Future Plans
1. **Expanding Data Sources:** Enhancing the system to capture financial data from additional exchanges and financial databases, thereby broadening the scope and depth of available information.
2. **Improving Data Processing:** Developing advanced tools to process and clean the collected data, ensuring it is fully prepared for analysis and integration into financial models or reports.
3. **Implementing User Interfaces:** Creating intuitive interfaces for managing and visualizing the collected data, enabling users to easily access and interact with the information.
4. **Automating Updates:** Establishing an automated schedule for routine data retrieval and updates, ensuring financial information remains current and relevant.
5. **Developing Table Extraction:** Building robust table extraction capabilities to capture all valuable information from PDF documents related to each company, utilizing AI and OCR technologies.
6. **Building a Comprehensive Analytical Workflow:** Designing a complete analytical workflow to assess company performance by evaluating both quantitative and qualitative data.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
