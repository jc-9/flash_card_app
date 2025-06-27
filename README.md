
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
docker compose version # If you plan to use docker compose later
```

### 2. Pull the Docker Image

Once Docker is installed and running, you can pull the pre-built application image from Docker Hub.

Replace `YOUR_DOCKERHUB_USERNAME` with your actual Docker Hub username:

```bash
docker pull YOUR_DOCKERHUB_USERNAME/vocabulary-flashcards-app:latest
```

### 3. Create and Run the Docker Container

To run the application and ensure your vocabulary data persists even if the container is stopped or removed, we will use a [Docker volume mount](https://docs.docker.com/storage/volumes/).

First, navigate to the directory where you want to store your application's data (e.g., your preferred projects folder). Create a subdirectory named `data` in this location if it doesn't exist already:

```bash
# Example: Create a project directory and then a data subdirectory
mkdir vocabulary-app-data
cd vocabulary-app-data
mkdir data
```

