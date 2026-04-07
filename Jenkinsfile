pipeline {
    agent any

    environment {
        BACKEND_IMAGE     = "freelance-marketplace-backend"
        BACKEND_CONTAINER = "freelance-marketplace-backend-container"
        BACKEND_PORT      = "5000"
        REPO_URL          = "https://github.com/Prabhath18/freelance-marketplace.git"
    }

    stages {

        // ─────────────────────────────────────────────
        // STAGE 1 — Clone Repository
        // ─────────────────────────────────────────────
        stage('Clone Repository') {
            steps {
                echo "Cloning repository from ${REPO_URL}..."
                git branch: 'main', url: "${REPO_URL}"
                echo "Repository cloned successfully."
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 2 — Verify Project Structure
        // ─────────────────────────────────────────────
        stage('Verify Project Structure') {
            steps {
                bat '''
                    IF NOT EXIST backend (
                        echo ERROR: backend folder is missing!
                        exit /b 1
                    )
                    IF NOT EXIST backend\\Dockerfile (
                        echo ERROR: backend\\Dockerfile is missing!
                        exit /b 1
                    )
                    IF NOT EXIST backend\\package.json (
                        echo ERROR: backend\\package.json is missing!
                        exit /b 1
                    )
                    IF NOT EXIST backend\\server.js (
                        echo ERROR: backend\\server.js is missing!
                        exit /b 1
                    )
                    IF NOT EXIST frontend (
                        echo ERROR: frontend folder is missing!
                        exit /b 1
                    )
                    IF NOT EXIST frontend\\index.html (
                        echo ERROR: frontend\\index.html is missing!
                        exit /b 1
                    )
                    echo All required project files are present.
                '''
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 3 — Install Backend Dependencies
        // ─────────────────────────────────────────────
        stage('Install Backend Dependencies') {
            steps {
                echo "Installing backend dependencies..."
                bat 'cd backend && npm install'
                echo "Backend dependencies installed."
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 4 — Run Backend Tests
        //   TC01: GET /  → server health check
        //   TC02: Register success
        //   TC03: Register DB error
        //   TC04: Register missing fields
        //   TC05: Login success
        //   TC06: Login wrong password
        //   TC07: Login DB error
        //   TC08: Create task success
        //   TC09: Create task DB error
        //   TC10: Get tasks success
        //   TC11: Get tasks DB error
        //   TC12: Accept task success
        //   TC13: Accept task not available
        //   TC14: Accept task DB error
        //   TC15: Complete task success
        //   TC16: Complete task DB error
        // ─────────────────────────────────────────────
        stage('Test: Backend API') {
            steps {
                bat 'cd backend && npx jest server.test.js --no-coverage --verbose'
            }
            post {
                failure {
                    echo "BACKEND TESTS FAILED — check route logic in server.js"
                }
                success {
                    echo "BACKEND TESTS PASSED — all 17 test cases verified."
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 5 — Build Backend Docker Image
        // ─────────────────────────────────────────────
        stage('Build Backend Docker Image') {
            steps {
                echo "Building Docker image: ${BACKEND_IMAGE}..."
                bat 'cd backend && docker build -t %BACKEND_IMAGE% .'
                echo "Docker image built successfully."
            }
            post {
                failure {
                    echo "DOCKER BUILD FAILED — check your backend/Dockerfile for errors."
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 6 — Stop & Remove Old Container (if any)
        //           Also kills ANY container using port 5000
        //           to prevent "port already in use" errors
        // ─────────────────────────────────────────────
        stage('Cleanup Old Container') {
            steps {
                echo "Stopping and removing old container if it exists..."
                bat '''
                    @echo off

                    REM Stop & remove the named container
                    docker stop %BACKEND_CONTAINER% 2>nul
                    docker rm   %BACKEND_CONTAINER% 2>nul

                    REM Kill ANY other container that is already bound to port 5000
                    FOR /F "tokens=*" %%i IN ('docker ps -q --filter "publish=%BACKEND_PORT%"') DO (
                        echo Found container %%i using port %BACKEND_PORT% — stopping it...
                        docker stop %%i 2>nul
                        docker rm   %%i 2>nul
                    )

                    exit /b 0
                '''
                echo "Cleanup done."
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 7 — Run Backend Container
        // ─────────────────────────────────────────────
        stage('Deploy Backend Container') {
            steps {
                echo "Starting backend container on port ${BACKEND_PORT}..."
                bat '''
                    docker run -d ^
                        --name %BACKEND_CONTAINER% ^
                        -p %BACKEND_PORT%:%BACKEND_PORT% ^
                        --restart unless-stopped ^
                        %BACKEND_IMAGE%
                '''
                echo "Backend container started successfully."
            }
            post {
                failure {
                    echo "DEPLOYMENT FAILED — check Docker logs: docker logs ${BACKEND_CONTAINER}"
                }
                success {
                    echo "Backend is live at http://localhost:${BACKEND_PORT}"
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 8 — Verify Container is Running
        // ─────────────────────────────────────────────
        stage('Health Check') {
            steps {
                echo "Verifying backend container is running..."
                bat '''
                    docker ps --filter "name=%BACKEND_CONTAINER%" --filter "status=running" | findstr %BACKEND_CONTAINER%
                    IF %ERRORLEVEL% NEQ 0 (
                        echo ERROR: Container is NOT running!
                        exit /b 1
                    )
                    echo Health check passed — container is running.
                '''
            }
        }

    }

    // ─────────────────────────────────────────────────
    // POST — Final pipeline status notifications
    // ─────────────────────────────────────────────────
    post {
        success {
            echo "=========================================="
            echo " PIPELINE SUCCEEDED"
            echo " Backend : http://localhost:${BACKEND_PORT}"
            echo " Frontend: Open frontend/index.html in browser"
            echo "=========================================="
        }
        failure {
            echo "=========================================="
            echo " PIPELINE FAILED — review the stage logs above."
            echo "=========================================="
        }
    }
}