import {ListGroup} from 'react-bootstrap/ListGroup';
import Card from 'react-bootstrap/Card';

// just image, like, date and who posted it. To see comments need to click on it. Might add a comment button like in insta
//don't know if we need states. Just pulling data from somewhere and showing it so probs not
//array == user, likes, date, img 
//used for home page
function ProfilePreview({title, username, date, likes, img}){

    return (
        <Card style={{width: '18rem'}}>
            <Card.Img variant="top" src={img} />
            <Card.Body>
                <Card.Title>{title}</Card.Title>
                 <Card.Subtitle className="mb-2 text-muted">Author: {username}</Card.Subtitle>
            </Card.Body>
            <ListGroup className="list-group-flush">
                <ListGroup.Item>Date Posted: {date}</ListGroup.Item>
                <ListGroup.Item>Likes: {likes}</ListGroup.Item>
            </ListGroup>
            <Card.Body>
                {/* add button or make the whole thing a button to view more data on the item */}
            </Card.Body>
        </Card>
    )
}


export default ProfilePreview;