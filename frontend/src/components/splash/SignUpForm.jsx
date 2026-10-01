import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';

function SignUpForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [checkPassword, setCheckPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!username) newErrors.username = 'Username is empty. Please provide a username';
    else if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username))
      newErrors.username = '3-30 characters: letters, numbers, _ or .';

    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (!checkPassword) newErrors.checkPassword = 'Need to enter password confirm.';
    else if (password !== checkPassword) newErrors.checkPassword = 'Passwords do not match';

    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError('');

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          name: name.trim() || username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.data?.token) {
        throw new Error(data.message || 'Sign up failed');
      }

      localStorage.setItem('token', data.data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.data));
      setSuccess('Account created! Taking you to your feed...');
      setTimeout(() => navigate('/home'), 900);
    } catch (err) {
      console.error('SignUp request error:', err);
      setApiError(err.message || 'Server connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <h4 className="splash-form-title">Create your account</h4>

      {apiError && <Alert variant="danger">{apiError}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form.Group className="mb-3" controlId="signupName">
        <Form.Label>Full name <span className="splash-optional">(optional)</span></Form.Label>
        <Form.Control
          type="text"
          placeholder="Peter John"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="signupUsername">
        <Form.Label>Username</Form.Label>
        <Form.Control
          type="text"
          placeholder="peter_j"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          isInvalid={!!errors.username}
        />
        <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3" controlId="signupEmail">
        <Form.Label>Email address</Form.Label>
        <Form.Control
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          isInvalid={!!errors.email}
        />
        <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
      </Form.Group>

      <Row>
        <Col xs={12} sm={6}>
          <Form.Group className="mb-3" controlId="signupPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isInvalid={!!errors.password}
            />
            <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col xs={12} sm={6}>
          <Form.Group className="mb-3" controlId="signupConfirmPassword">
            <Form.Label>Confirm</Form.Label>
            <Form.Control
              type="password"
              placeholder="Re-enter"
              autoComplete="new-password"
              value={checkPassword}
              onChange={(e) => setCheckPassword(e.target.value)}
              isInvalid={!!errors.checkPassword}
            />
            <Form.Control.Feedback type="invalid">{errors.checkPassword}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Button variant="primary" type="submit" className="btn-block" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Sign Up'}
      </Button>
    </Form>
  );
}

export default SignUpForm;
