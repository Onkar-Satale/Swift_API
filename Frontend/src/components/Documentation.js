// frontend/src/pages/Documentation.jsx
import React from "react";
import "./Documentation.css";

const Documentation = () => {
  return (
    <div className="doc-page">
      <h1>API Documentation & User Guide</h1>

      <section>
        <h2>Introduction</h2>
        <p>
          Welcome to the API testing application! This platform allows you to send HTTP requests
          to any API endpoint, inspect responses, and manage headers, query parameters, and body
          content. It's a lightweight alternative to Postman with full support for AI assistance.
        </p>
      </section>

      <section>
        <h2>How Requests Work</h2>
        <p>
          You can send <strong>GET</strong>, <strong>POST</strong>, <strong>PUT</strong>,
          <strong>PATCH</strong>, and <strong>DELETE</strong> requests.
          The app allows you to configure the request method, headers, body, and query parameters.
        </p>
        <ul>
          <li><strong>GET:</strong> Retrieve data from a server.</li>
          <li><strong>POST:</strong> Send data to the server to create a resource.</li>
          <li><strong>PUT:</strong> Update existing data.</li>
          <li><strong>DELETE:</strong> Remove data.</li>
        </ul>
      </section>

      <section>
        <h2>Headers</h2>
        <p>
          Headers are key-value pairs sent along with your request. They provide additional information
          about the request or instructions for the server.
        </p>
        <ul>
          <li><strong>Authorization:</strong> Include Bearer tokens for secure endpoints.</li>
          <li><strong>Content-Type:</strong> Specify the type of request body (e.g., application/json).</li>
          <li><strong>Accept:</strong> Specify the type of response you expect from the server.</li>
        </ul>
        <p>
          Example:
        </p>
        <pre>
          {`{
  "Authorization": "Bearer <your_token_here>",
  "Content-Type": "application/json"
}`}
        </pre>
      </section>

      <section>
        <h2>Query Parameters</h2>
        <p>
          Query parameters are appended to the URL and allow you to filter or customize the server response.
        </p>
        <p>
          Example URL:
        </p>
        <pre>https://api.example.com/users?status=active&page=2</pre>
        <ul>
          <li><strong>status:</strong> Filters users by status.</li>
          <li><strong>page:</strong> Pagination parameter to select page number.</li>
        </ul>
      </section>

      <section>
        <h2>Request Body</h2>
        <p>
          For POST, PUT, PATCH requests, you can send data in the request body. This should usually
          be in JSON format.
        </p>
        <pre>
          {`{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin"
}`}
        </pre>
      </section>

      <section>
        <h2>Response Handling</h2>
        <p>
          Once you send a request, you will receive a response containing:
        </p>
        <ul>
          <li><strong>Status Code:</strong> HTTP status code (200, 404, 500, etc.)</li>
          <li><strong>Response Body:</strong> JSON or text returned by the server</li>
          <li><strong>Headers:</strong> Metadata about the response</li>
        </ul>
        <p>
          You can view the response in <strong>Pretty</strong>, <strong>Raw</strong>, or <strong>Preview</strong> modes.
        </p>
      </section>

      <section>
        <h2>Collections & Workspaces</h2>
        <p>
          You can group requests into collections for better organization. Workspaces allow collaboration with team members.
        </p>
        <ul>
          <li><strong>Collections:</strong> Organize requests logically by API or project.</li>
          <li><strong>Workspaces:</strong> Share collections with team members or use a personal workspace.</li>
        </ul>
      </section>

      <section>
        <h2>AI Assistant</h2>
        <p>
          The AI assistant helps you:
        </p>
        <ul>
          <li>Analyze API responses</li>
          <li>Explain errors</li>
          <li>Suggest improvements for headers, parameters, or request structure</li>
        </ul>
        <p>
          Example: If a 401 Unauthorized error occurs, the AI can suggest checking your Authorization header.
        </p>
      </section>

      <section>
        <h2>Error Codes</h2>
        <p>
          Common HTTP status codes:
        </p>
        <ul>
          <li><strong>200 OK:</strong> Request successful</li>
          <li><strong>201 Created:</strong> Resource successfully created</li>
          <li><strong>400 Bad Request:</strong> Invalid request syntax</li>
          <li><strong>401 Unauthorized:</strong> Missing or invalid authentication</li>
          <li><strong>403 Forbidden:</strong> Access denied</li>
          <li><strong>404 Not Found:</strong> Resource not found</li>
          <li><strong>500 Internal Server Error:</strong> Server-side error</li>
        </ul>
      </section>

      <section>
        <h2>Tips & Best Practices</h2>
        <ul>
          <li>Always validate URLs before sending requests.</li>
          <li>Use proper headers for authentication and content type.</li>
          <li>Check server responses carefully; inspect both headers and body.</li>
          <li>Use query parameters to avoid retrieving unnecessary data.</li>
          <li>Leverage collections and workspaces for better organization.</li>
          <li>AI suggestions can help you debug faster.</li>
        </ul>
      </section>

      <section>
        <h2>Further Reading</h2>
        <p>
          For more in-depth API concepts, authentication strategies, and HTTP standards,
          visit:
        </p>
        <ul>
          <li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP" target="_blank" rel="noreferrer">MDN Web Docs: HTTP</a></li>
          <li><a href="https://swagger.io/docs/" target="_blank" rel="noreferrer">Swagger API Documentation Guide</a></li>
          <li><a href="https://www.postman.com/" target="_blank" rel="noreferrer">Postman Learning Center</a></li>
        </ul>
      </section>
    </div>
  );
};

export default Documentation;
