# Backend2 Postman requests

1. In Postman, Import both JSON files in this folder.
2. Select **Backend2 - Local** as your environment.
3. Set baseUrl to your server address (default http://localhost:8000). Enter your username, email, fullname and password locally. No real credentials are included.
4. Start the backend and send Health check. Register a test user by selecting an avatar file, or use an existing account. Login saves accessToken, refreshToken and userId automatically.
5. Publish a test video by selecting videoFile and thumbnail. Create a playlist, comment and tweet as needed; successful create requests save their IDs. You can also set IDs manually for existing test records.
6. Set channelId to another user's ID for subscription toggling, subscriberId to the desired subscriber ID, and channelUsername for the channel profile.
7. Send requests individually. Toggle requests change state. Change password updates your credentials; update the password variable afterward. Cleanup requests permanently delete the selected records and should run last. Avoid blindly running the whole collection against real data.

The collection covers all 42 declared method/path pairs and adds one video-search example (43 requests). Upload fields marked disabled are optional; enable them and select files when needed. Do not add a multipart Content-Type header manually; Postman generates its boundary.

Known backend failures are described on affected requests: refresh-token handling, tweet creation/ownership checks, missing model references in comments/likes, and subscription parameter mismatches. Several user/comment responses currently swap message and data; ID capture accepts either placement. Failed success assertions indicate API/setup issues, not a successful check. No server requests have been executed by the generator.

Do not commit populated environment exports containing passwords or tokens.
