# Dockerfile
# Use an official Python runtime as a parent image
FROM python:3.12-slim-bullseye

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container at /app
COPY . .

# Create a volume for persistent data
# This will allow you to map a host directory to /app/data
VOLUME /app/data

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Run the Flask application
# The command to run your app will be 'python app.py'
CMD ["python", "app.py"]