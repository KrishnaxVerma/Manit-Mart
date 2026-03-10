import { collection, addDoc, doc, setDoc } from 'firebase/firestore'
import { db, auth } from './firebase'

const dummyProducts = [
  {
    title: "Engineering Mathematics Book",
    category: "Books",
    price: 350,
    condition: "Good",
    description: "Third year engineering mathematics book by B.S. Grewal. Minimal highlighting, all pages intact.",
    imageUrls: ["https://imgv2-2-f.scribdassets.com/img/document/561674888/original/1ca6d53c43/1?v=1"],
    sellerId: "fqELYf6WmkRFk3evkTzmiwOZ9e13",
    sellerName: "Krishna",
    sellerEmail: "2311201112@stu.manit.ac.in",
    interested: [],
    createdAt: new Date(Date.now() - 86400000 * 5)
  }
  ,
  {
    title: "HP Laptop 15s",
    category: "Electronics", 
    price: 28000,
    condition: "Like New",
    description: "HP 15s laptop, 8GB RAM, 512GB SSD, bought 6 months ago. Excellent condition with original charger.",
    imageUrls: ["https://drive.google.com/file/d/2ghi789/view", "https://drive.google.com/file/d/2jkl012/view"],
    sellerId: "demo-user-2",
    sellerName: "priya",
    sellerEmail: "priya@stu.manit.ac.in",
    interested: [],
    createdAt: new Date(Date.now() - 86400000 * 3)
  },
  {
    title: "Gear Cycle 21 Speed",
    category: "Others",
    price: 4500,
    condition: "Good",
    description: "Hero gear cycle with 21 speed gears. Recently serviced, good for campus rides.",
    imageUrls: ["https://drive.google.com/file/d/3mno345/view"],
    sellerId: "demo-user-3", 
    sellerName: "amit",
    sellerEmail: "amit@stu.manit.ac.in",
    interested: [],
    createdAt: new Date(Date.now() - 86400000 * 2)
  },
  {
    title: "Mechanical Drawing Set",
    category: "Stationary",
    price: 800,
    condition: "Fair",
    description: "Complete drawing set with T-scale, set squares, compass, and divider. Used for 2 semesters.",
    imageUrls: ["https://drive.google.com/file/d/4pqr678/view"],
    sellerId: "demo-user-1",
    sellerName: "rahul", 
    sellerEmail: "rahul@stu.manit.ac.in",
    interested: [],
    createdAt: new Date(Date.now() - 86400000 * 1)
  },
  {
    title: "Wireless Headphones",
    category: "Electronics",
    price: 1200,
    condition: "Good",
    description: "Boat wireless headphones with good battery life. Minor scratches but works perfectly.",
    imageUrls: ["https://drive.google.com/file/d/5stu901/view"],
    sellerId: "demo-user-4",
    sellerName: "neha",
    sellerEmail: "neha@stu.manit.ac.in",
    interested: [],
    createdAt: new Date(Date.now() - 86400000 * 4)
  },
  {
    title: "Data Structures Book",
    category: "Books",
    price: 450,
    condition: "Like New",
    description: "Data Structures and Algorithms by Narasimha Karumanchi. Brand new condition, no markings.",
    imageUrls: ["https://drive.google.com/file/d/6vwx234/view"],
    sellerId: "demo-user-2",
    sellerName: "priya",
    sellerEmail: "priya@stu.manit.ac.in",
    interested: [],
    createdAt: new Date(Date.now() - 86400000 * 6)
  },
  {
    title: "Calculator Scientific",
    category: "Stationary",
    price: 600,
    condition: "Good",
    description: "Casio scientific calculator fx-991EX. Perfect for engineering calculations.",
    imageUrls: ["https://drive.google.com/file/d/7yza567/view"],
    sellerId: "demo-user-5",
    sellerName: "vijay",
    sellerEmail: "vijay@stu.manit.ac.in",
    interested: [],
    createdAt: new Date(Date.now() - 86400000 * 7)
  },
  {
    title: "Backpack",
    category: "Accessories",
    price: 750,
    condition: "Fair",
    description: "Spacious backpack with laptop compartment. Used for 1 year, still in good condition.",
    imageUrls: ["https://drive.google.com/file/d/8bcd890/view"],
    sellerId: "demo-user-3",
    sellerName: "amit",
    sellerEmail: "amit@stu.manit.ac.in",
    interested: [],
    createdAt: new Date(Date.now() - 86400000 * 8)
  }
]

const dummyUsers = [
  {
    name: "Rahul Sharma",
    email: "rahul@stu.manit.ac.in",
    hostel: "Hostel A",
    role: "student"
  },
  {
    name: "Priya Patel",
    email: "priya@stu.manit.ac.in", 
    hostel: "Hostel B",
    role: "student"
  },
  {
    name: "Amit Kumar",
    email: "amit@stu.manit.ac.in",
    hostel: "Hostel C", 
    role: "student"
  },
  {
    name: "Neha Singh",
    email: "neha@stu.manit.ac.in",
    hostel: "Hostel D",
    role: "student"
  },
  {
    name: "Vijay Kumar",
    email: "vijay@stu.manit.ac.in",
    hostel: "Hostel E",
    role: "student"
  }
]

export const seedDatabase = async () => {
  try {
    console.log("Seeding database with dummy data...")
    
    for (const user of dummyUsers) {
      const userRef = doc(db, 'users', user.email.replace('@', '_').replace('.', '_'))
      await setDoc(userRef, user)
      console.log(`Added user: ${user.name}`)
    }
    
    for (const product of dummyProducts) {
      await addDoc(collection(db, 'products'), product)
      console.log(`Added product: ${product.title}`)
    }
    
    console.log("Database seeded successfully!")
    return true
  } catch (error) {
    console.error("Error seeding database:", error)
    return false
  }
}

if (typeof window !== 'undefined') {
  window.seedDatabase = seedDatabase
}
