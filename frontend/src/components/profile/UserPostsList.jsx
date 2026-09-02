//will be used to show user posts, will reuse PostPreview, as it is not neccessary to change it. Only thing it will show author under users posts
//this way user will always know who it is if he forgets or looks away or scroll too far away.


import React, {useEffect, useState} from 'react';
import {PostPreview} from '../common/PostPreview';
import {posts} from '../../data/mockPosts'

//get the user from endpoint. Hence will call the array in here from mock data. Can replace later
//will take in userId and then call on it and get array
function UserPosts({ userId }) {
    const [arr, setArr] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchUserPosts = async () => {
            // Yielding execution using await moves subsequent state updates 
            // out of the synchronous body of the effect.
            await Promise.resolve();

            if (!isMounted) return;
            setIsLoading(true);

            try {
                // Mock filtering logic
                const userPosts = posts.filter(post => post.userId === userId);
                
                if (isMounted) {
                    setArr(userPosts);
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchUserPosts();

        return () => {
            isMounted = false;
        };
    }, [userId]);

    if (isLoading) return <div>Loading posts...</div>;

    return (
        <div>
            {arr.map(post => (
                <PostPreview 
                    key={post.id} 
                    title={post.title} 
                    username={post.username} 
                    dates={post.dates} 
                    likes={post.likes} 
                    img={post.img} 
                />
            ))}
        </div>
    );
}

export default UserPosts;