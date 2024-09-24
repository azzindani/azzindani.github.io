---
layout: default
title: page1
profile: false
headline: false
---

# IDX Financial Statement Excel Only

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
This project aims to develop a web scraping system specifically designed to extract various financial data from stock exchange databases, focusing exclusively on collecting financial report tables in Excel format.

The primary goal of this project is to build a robust web scraping system capable of automatically gathering and organizing financial data. This serves as a foundational step towards creating a comprehensive quantitative dataset that can be used to build a financial database and support future analysis.

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
At this stage, I am utilizing a multi-threaded bot directly, with tasks differing from the previous bot, which involves a more complex download script. This approach allows me to save time while collecting over 2,500 Excel files from all publicly listed companies in Indonesia.

The bot performs the following tasks: it opens Chromedriver, navigates to the website (https://www.idx.co.id/id/perusahaan-tercatat/laporan-keuangan-dan-tahunan), enters keywords into the search tab, selects the year and quarter, clicks “search”/“apply,” downloads the Excel files, and saves them in a temporary directory. The final step involves renaming the files from the temporary path and moving them to a new location with an organized folder structure.

3. Files Check
After downloading all the Excel financial reports, I need to verify the completeness of the bot's work. Fortunately, I was able to collect financial reports dating back to 2015 using an HTML injection script. However, this method is no longer applicable at this time.

5. Data Transformation
a. The first data transformation involves extracting tabular data into multiple files.
b. The second step is to convert these files into numerical data, enabling analysis when the files are merged.
c. The final step is to combine the data, and here is an example of the results.

7. Analytic & Visualization
Currently, data analysis requires accounting methodologies, which will be available once I complete my studies in accounting. As for data visualization, it is still in development; for now, we can use Microsoft Excel to create charts and other visual representations.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Challenges
1. **Data Collection Speed:** Data collection was initially slow due to using only a single bot. Therefore, I developed a multi-threading bot capable of running simultaneously to increase efficiency.
2. **Network Constraints:** Network limitations can affect data quality and potentially cause system crashes. To mitigate this, I need to limit the number of bots running concurrently.
3. **Handling Pop-Up Messages:** Occasionally, pop-ups appear during the process, which needs to be managed effectively.
4. **Data Quality:** Ensuring the accuracy and completeness of the scraped data, and addressing inconsistencies or errors in source documents.
5. **Website Changes:** Adapting to changes in website structure and data formats, which can impact the scraping process and require continuous maintenance.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Insights
1. **Parallel Browsing:** Multiprocessing allows you to launch multiple browser instances simultaneously, each performing independent scraping tasks. This parallelism can significantly reduce overall execution time, especially when tasks involve loading multiple web pages or downloading large amounts of data.
2. **Limiting Browser Instances:** Controlling the number of concurrent browser instances to match the available CPU cores prevents overloading and ensures optimal performance.
3. **Driver Configuration:** Carefully configure each WebDriver instance, including options such as headless mode, to reduce visual overhead and conserve resources.
4. **Task Assignment:** Distribute data or tasks evenly among processes. For example, each process can handle a portion of URLs or a range of search keywords. Proper workload balancing prevents some processes from finishing too quickly while others lag behind.
5. **Handling Shared Data:** If data needs to be shared among processes, use multiprocessing queues or shared memory constructs. Avoid using global variables, as they are not shared across processes.
6. **Managing Failures:** Websites may block or limit requests if they detect bot-like behavior. Implementing try-except blocks and setting up automatic retries for failed requests can help ensure resilience.
7. **WebDriver Timeout:** Set appropriate timeouts for WebDriver operations to prevent processes from hanging indefinitely due to slow-loading pages or network issues.
8. **Browser and WebDriver Compatibility:** Ensure compatibility between the browser and the corresponding WebDriver versions. Version mismatches can lead to unexpected failures.
9. **Scalability:** Designing the system to handle large volumes of data and support scalability will ensure its effectiveness as data needs grow.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Future Plans
1. **Expanding Data Sources:** Enhance the system to capture financial data from additional exchanges and financial databases, thereby broadening the scope and depth of available information.
2. **Improving Data Processing:** Develop tools to process and clean the collected data, ensuring it is ready for analysis and integration into financial models or reports.
3. **Implementing User Interfaces:** Create an intuitive interface for managing and visualizing the collected data, enabling users to easily access and interact with the information.
4. **Automating Updates:** Establish an automated schedule for routine data retrieval and updates, ensuring that financial information remains current and relevant.
5. **Developing a Database Storage System:** Create a database storage system that maintains all collected datasets, making them easily analyzable.
6. **Building a Comprehensive Analytical Workflow:** Design a complete analytical workflow to assess company performance by evaluating both quantitative and qualitative data.

<p align="right">(<a href="#readme-top">back to top</a>)</p>