import { useState } from "react";
import "./LoginPage.css";
import axios from "axios";

function LoginPage() {
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  // const [loading, setLoading] = useState<boolean>(false);
  // const [error, setError] = useState<string>();

  const handleSubmit = async () => {
    try {
      // setLoading(true)
      // setError("");
      const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}user/login`, {username: email, password: password});
      if(response.data.success){
        await localStorage.setItem('token', response.data.data.token);
        await localStorage.setItem('userId', response.data.data.id);
        window.location.href = "/chat";
      }
    } catch (error:any) {
      alert(error.message);
    } finally {
      // setLoading(false);
      // setError("");
    }
  };

  return (
    <div className="login-form">
      <h1>Login</h1>
      <input
        type="email"
        name="email"
        placeholder="Enter your email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        name="password"
        placeholder="Enter your password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={()=>handleSubmit()}>
        Submit
      </button>
    </div>
  );
}

export default LoginPage;
