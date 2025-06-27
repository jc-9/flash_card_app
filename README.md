
# 📚 Vocabulary Flash Cards App

Mastering new vocabulary just got easier and smarter! The Vocabulary Flash Cards App is a simple web application designed to help you learn and practice new words, track your pronunciation efforts, and identify challenging words using a visual Pareto chart.

![App Screenshot](https://placehold.co/800x400/b0c4de/34495e?text=Your%20App%20Screenshot%20Here)

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
-p 5000:5000: Maps port 5000 on your computer to port 5000 inside the Docker container.

-v "$(pwd)/data:/app/data": This is crucial! It mounts your host machine's <path to your directory> /data directory (relative to where you run the command) to the /app/data directory inside the container. This means:

Your vocabulary.db SQLite database will be stored in your local data folder.

Any words you upload or statistics you generate will be saved on your local machine and persist across container restart
