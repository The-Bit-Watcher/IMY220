import React, { useEffect, useState } from 'react';
import PostPreview from '../common/PostPreview/PostPreview';
import { posts } from '../../data/mockPosts';

function UserPosts({ userId }) {
  const [arr, setArr] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUserPosts = async () => {
      await Promise.resolve();

      if (!isMounted) return;
      setIsLoading(true);

      try {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500 text-sm gap-2">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading posts...</span>
      </div>
    );
  }

  if (arr.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500 text-sm my-3">
        This user hasn't posted anything yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 my-3">
      {arr.map(post => (
        <PostPreview 
          key={post.id} 
          title={post.title} 
          username={post.username} 
          dates={post.dates || post.createdAt} 
          likes={post.likes} 
          img={post.img || post.image} 
        />
      ))}
    </div>
  );
}

export default UserPosts;