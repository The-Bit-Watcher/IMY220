import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';

function ReportPostModal({ show, onHide, postId, reasons = [], onSubmitReport }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedReason) return;

    if (onSubmitReport) {
      onSubmitReport({
        postId,
        reason: selectedReason,
        details: additionalDetails,
        reportedAt: new Date().toISOString()
      });
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedReason('');
      setAdditionalDetails('');
      onHide();
    }, 1500);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5 text-danger">Report Post</Modal.Title>
      </Modal.Header>
      {submitted ? (
        <Modal.Body>
          <Alert variant="success" className="mb-0">
            Thank you. Your report has been submitted for moderation.
          </Alert>
        </Modal.Body>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <p className="text-muted small mb-3">
              Please select a reason why you are reporting this content:
            </p>

            <Form.Group className="mb-3">
              {reasons.map((reason, index) => (
                <Form.Check
                  key={index}
                  type="radio"
                  id={`reason-${index}`}
                  name="reportReason"
                  label={reason}
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mb-2"
                />
              ))}
            </Form.Group>

            <Form.Group className="mb-3" controlId="reportDetails">
              <Form.Label className="small fw-semibold">Additional Details (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Provide extra context if needed..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={!selectedReason}>
              Submit Report
            </Button>
          </Modal.Footer>
        </Form>
      )}
    </Modal>
  );
}

export default ReportPostModal;