### Code Execution Platform System Design

![image](https://github.com/user-attachments/assets/2eb855e3-06b1-4a66-82db-b05927f57617)

**Code Execution Platform**

### Components

1. **Code-Judge**
   - Responsible for evaluating the submitted code against different programming languages.
   - Enforces time and memory limits while executing the code.
   - Tests the submitted code against all provided test cases.
   - Picks up jobs from the RabbitMQ queue and processes them.

2. **IDE-Backend**
   - Pushes submitted code to the queue for execution.
   - Ensures that the job is correctly formatted and ready for processing by workers.

3. **IDE-Frontend**
   - User interface for the code execution platform.
   - Allows users to submit code and interact with the system.

4. **Redis**
   - Stores execution results using the commit ID as the key.
   - After successful execution, results are saved in Redis.
   - Users can poll the backend with the commit ID to check if execution results are available.

5. **RabbitMQ**
   - Stores submitted code execution jobs in a queue.
   - Ensures workers pick up and process jobs asynchronously.

### Workflow
1. The user submits code through the frontend.
2. The backend pushes the code execution job to the RabbitMQ queue.
3. A worker from the Code-Judge component picks up the job from the queue.
4. The worker executes the code with the provided test cases while enforcing limits.
5. Execution results are stored in Redis with the commit ID.
6. The user polls the backend with the commit ID to retrieve the results.
7. The backend checks Redis and returns results if available.

### Tech Stack
- **Frontend**: Next.js, React
- **Backend**: Node.js, Express
- **Queue Management**: RabbitMQ
- **Worker Execution**: Docker, Code-Judge Engine
- **Database**: Redis (for storing execution results)
- **Containerization**: Docker
- **Orchestration**: Kubernetes (optional for scaling workers)
- **Version Control**: Git

