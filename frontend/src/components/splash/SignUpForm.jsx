import React, {useState} from 'react';
import {Form, Button, Container, Row, Col} from 'react-bootstrap';

function SignUp(){
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [checkPassword, setCheckPassword] = useState('');
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
        //should also add check for dup email
        if (!username) newErrors.username = 'Username is empty. Please provide a username';
        //else if here will be a check for dup usernames 
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

        if (!checkPassword) newErrors.checkPassword = "Need to enter password confirm.";
        else if (password !== checkPassword) newErrors.checkPassword = "Password and confirmed password does not match";

        return newErrors;
  };

    const handleSubmit = (event) => {
        event.preventDefault();

        const formErrors = validateForm();
        if (Object.keys(formErrors).lenght > 0){
            setErrors(formErrors);
        }
        else{
            setErrors({});
            console.log(`Login attempted with: ${email} ${password}`);
            //add func to backend. server.js
        }
    }

    return (
        <Container>
            <Row className="justify-content-md-center mt-5">
                <Col xs={12} md={6}>
                    <h2 className='text-center mb-4'>Signup</h2>
                    
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                            type="Username"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            isInvalid={!!errors.username}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.username}
                        </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            isInvalid={!!errors.email}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.email}
                        </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            isInvalid={!!errors.password}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.password}
                        </Form.Control.Feedback>
                        </Form.Group>
                        
                        <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label>Confirm Password</Form.Label>
                        <Form.Control
                            type="Confirm password"
                            placeholder="Re-enter Password"
                            value={checkPassword}
                            onChange={(e) => setCheckPassword(e.target.value)}
                            isInvalid={!!errors.checkPassword}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.checkPassword}
                        </Form.Control.Feedback>
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100">
                            Sign Up
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    )
}


export default SignUp;