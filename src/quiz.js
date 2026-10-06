export const quiz = {
  id: "devops-basics",
  title: "DevOps Fundamentals Quiz",
  description: "Test your knowledge of CI/CD, containers, and reliable software delivery.",
  questions: [
    {
      id: "q1",
      text: "What is the main purpose of Continuous Integration (CI)?",
      options: [
        { id: "a", text: "Automatically merge every change into production" },
        { id: "b", text: "Frequently integrate changes and run automated checks" },
        { id: "c", text: "Replace all software testing with manual review" },
        { id: "d", text: "Make developers work on the same computer" }
      ],
      correctOptionId: "b",
      explanation: "CI regularly integrates code changes and runs automated checks to find problems early."
    },
    {
      id: "q2",
      text: "What does a Docker image contain?",
      options: [
        { id: "a", text: "A running copy of an application only" },
        { id: "b", text: "A version-control branch" },
        { id: "c", text: "An application and the filesystem and dependencies it needs" },
        { id: "d", text: "A cloud server account" }
      ],
      correctOptionId: "c",
      explanation: "An image is a packaged template with the application and its runtime dependencies; containers run from images."
    },
    {
      id: "q3",
      text: "In this project, when does the workflow publish the container image to GHCR?",
      options: [
        { id: "a", text: "On every pull request" },
        { id: "b", text: "Only after a push to the main branch passes tests" },
        { id: "c", text: "Whenever someone opens the README" },
        { id: "d", text: "Only when running npm test locally" }
      ],
      correctOptionId: "b",
      explanation: "The workflow builds on pull requests, but only pushes to main log in and publish the image."
    },
    {
      id: "q4",
      text: "Why should a deployment have a health check?",
      options: [
        { id: "a", text: "To check whether the application is responding" },
        { id: "b", text: "To automatically rewrite the application code" },
        { id: "c", text: "To make the container image smaller" },
        { id: "d", text: "To replace source control" }
      ],
      correctOptionId: "a",
      explanation: "A health check helps detect whether the running service is ready and responding."
    },
    {
      id: "q5",
      text: "What is the role of an automated test job in a CI pipeline?",
      options: [
        { id: "a", text: "To guarantee that software has no possible bugs" },
        { id: "b", text: "To check code behavior and catch regressions before delivery" },
        { id: "c", text: "To publish passwords into the build logs" },
        { id: "d", text: "To replace the application runtime" }
      ],
      correctOptionId: "b",
      explanation: "Automated tests give repeatable feedback and help catch regressions; they cannot prove the absence of every bug."
    }
  ]
};

export function getPublicQuiz() {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    questions: quiz.questions.map(({ id, text, options }) => ({ id, text, options }))
  };
}

export function gradeQuiz(answers) {
  return quiz.questions.map((question) => {
    const selectedOptionId = answers[question.id] ?? null;
    const correctOption = question.options.find((option) => option.id === question.correctOptionId);

    return {
      questionId: question.id,
      selectedOptionId,
      correctOptionId: question.correctOptionId,
      correctOptionText: correctOption.text,
      isCorrect: selectedOptionId === question.correctOptionId,
      explanation: question.explanation
    };
  });
}
