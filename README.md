
# 📚 Vocabulary Flash Cards App

Mastering new vocabulary just got easier and smarter! The Vocabulary Flash Cards App is a simple web application designed to help you learn and practice new words, track your pronunciation efforts, and identify challenging words using a visual Pareto chart.

![flashcard app new screen.jpg](https://github.com/jc-9/flash_card_app/blob/main/flashcard%20app%20new%20screen.jpg)

## ✨ Features

* **CSV Upload:** Easily import new vocabulary lists from CSV files.
* **Database Management:** Add, edit, and delete words directly from the UI.
* **Interactive Flashcard Test:** Practice words and self-assess your pronunciation.
* **Pronunciation Tracking:** Keep count of correct and incorrect attempts for each word.
* **Overall Statistics:** View your total correct/incorrect counts and overall accuracy.
* **Failure Frequency Chart (Pareto Chart):** Visualize words you struggle with most, helping you focus your study efforts.
* **Dockerized Deployment:** Ready to run anywhere with Docker!

## 🚀 Getting Started

This guide will help you get the Vocabulary Flash Cards App up and running on your local machine using Docker.

### 1. Prerequisites: Install Docker

First, you need to have Docker installed on your system. Follow the official Docker installation guide for your operating system:

* **Windows:** [Install Docker Desktop on Windows](https://docs.docker.com/desktop/install/windows-install/)
* **macOS:** [Install Docker Desktop on Mac](https://docs.docker.com/desktop/install/mac-install/)
* **Linux:** [Install Docker Engine on Linux](https://docs.docker.com/engine/install/) (Choose your specific distribution, e.g., Ubuntu, Debian, CentOS).

Make sure Docker is running after installation. You can verify by opening a terminal and typing:

```bash
docker --version
```

You shopuld see an oputput similar to this: 
```
Docker version 28.0.4, build b8034c0
```

### 2. Pull the Docker Image

Once Docker is installed and running, you can pull the pre-built application image from Docker Hub. Right now we are using V1.2 for the version number but you can check out my docker hub for the latest version

```bash
docker pull justinmelmarclay/vocabulary-flashcards-app:v1.2
```

### 3. Create and Run the Docker Container

When running the application, we will need to save all the data to a directory on your sysyem. This where the word database will be saved so that in the event that you need to restart this application you can re-connect to the same data and nothing will be lost. This is important because if/when the docker system crashes, you want to have all the data saved so you can pick right back up where you were. 

First, navigate to the directory where you want to store your application's data (e.g., your preferred projects folder). Create a subdirectory named `data` in this location if it doesn't exist already:

```bash
# Example: Create a project directory and then a data subdirectory
mkdir vocabulary-app-data
cd vocabulary-app-data
mkdir data
```

Now, from the vocabulary-app-data directory (or wherever you want your data folder to be), run the following command to create and start your Docker container:

```bash
docker run -p 5010:5010 -v "<path to your directory>/data:/app/data" justinmelmarclay/flashcards-app:v1.2
```
* -p 5010:5010: Maps port 5010 on your computer to port 5010 inside the Docker container. Note: you can pick any port that is availble. If port 5010 is being used, then pick 5011 and go on from there until you find one that works, but keep the docker container port as 5010 (the port on the right). So this would look like 5011:5010

* -v "<path to your directory>/data:/app/data": This is crucial! It mounts your host machine's <path to your directory> /data directoryto the /app/data directory inside the container. This means:

* Your vocabulary.db SQLite database will be stored in your local data folder.

* Any words you upload or statistics you generate will be saved on your local machine and persist across container restart

### Step 4. Run the container 

4. Use the App
* Once the Docker container is running, open your web browser and navigate to:

* http://localhost:5010/ or whatever port you decided to use (ie. http://localhost:5011/)

* You should see the Vocabulary Flash Cards App!


### Watch a quick demo on how to use the app:

[![Flashcard App](https://github.com/jc-9/flash_card_app/blob/main/flashcard%20app%20new%20screen.jpg)](https://youtu.be/ovLI9Y-f1zQ)
