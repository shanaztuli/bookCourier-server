📚 BookCourier – Library-to-Home Delivery System
🔗 Live Site
https://bookcourier12.netlify.app/

📂 Repositories
**Client Side:**https://github.com/shanaztuli/bookCourier-client
Server Side: https://github.com/shanaztuli/bookCourier-server
🔐 Admin Credentials
**Admin Email:**simlaloskor@gmail.com
Admin Password: 331312aA@



🎯 Project Purpose
BookCourier is a full-stack library delivery management system that allows users to order books from nearby libraries and get them delivered to their homes. The platform supports role-based dashboards for users, librarians, and admins, ensuring secure, efficient, and user-friendly book ordering and management.

🧩 Key Features
🌐 General Features
Responsive design for mobile, tablet, and desktop
Light/Dark theme toggle
Firebase Authentication (Email/Password + Social Login)
Secure role-based dashboards
JWT protected API routes using Firebase token verification
Wishlist and review system
Stripe payment integration


🏠 Home Page
Banner with 3 sliders (book image, title, description, CTA)
Latest Books section (recently added books)
Coverage section with delivery map
Why Choose BookCourier section
At least 1 animated section
2 additional well-designed sections


📚 Books Section
All Books
Displays all published books
Search books by name
Sort books by price
Card-based responsive layout
Book Details
Full book information
Wishlist button
Order Now modal with:
Name (readonly)
Email (readonly)
Phone number
Address
Review & rating system (only after paid order)


👤 User Dashboard
My Orders
View order status
Cancel pending orders
Pay for pending orders
My Profile
Update name and profile image
Invoices
View payment history with transaction ID, amount, and date
My Wishlist
View wishlisted books
📚 Librarian Dashboard
Add Book
Title, image, author, price, status (published/unpublished)
My Books
View and edit books
Unpublish books (delete disabled)
Orders
View orders for librarian’s books
Update order status:
Pending → Shipped → Delivered
Cancel orders if needed


🛠 Admin Dashboard
All Users
View all registered users
Assign roles (User / Librarian / Admin)
Manage Books
Publish / unpublish books
Delete books (also deletes related orders)
Admin Profile
Update profile information
Dashboard charts & statistics for quick insights
🔐 Authentication & Security
Firebase Authentication
Firebase Admin SDK on server
JWT token verification for protected routes
Role-based access control (User, Librarian, Admin)
Environment variables used for:
Firebase service key
MongoDB credentials
Stripe secret key


💳 Payment System
Stripe Checkout integration
Secure payment handling
Automatic order status update after payment
Payment records stored in database


⭐ Review & Rating System
Only users with paid orders can submit reviews
Average rating calculated dynamically
Reviews visible on book details page


🧪 Technologies Used
Frontend
React
React Router DOM
Tailwind CSS
Firebase Authentication
React Toastify
Recharts / Chart.js
Framer Motion (animations)
Backend
Node.js
Express.js
MongoDB
Firebase Admin SDK
Stripe
JWT (Firebase token verification)
dotenv
CORS


🚀 Deployment
Client: Vercel / Netlify
Server: Vercel / Render
Firebase domain authorization configured
Production server free of CORS, 404, or reload issues
Private routes persist authentication on refresh
✅ Commit History
✔ 20+ meaningful commits on client side
✔ 12+ meaningful commits on server side
✔ Descriptive commit messages followed
📌 Optional Enhancements Implemented
Wishlist functionality
Dark/Light theme
Clean, recruiter-friendly UI


👨‍💻 Author
**Name:**shanaz **Email:**shanazparbinloskortuli@gmail.com

✨ Thank you for reviewing BookCourier!
