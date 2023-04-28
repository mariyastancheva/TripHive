const dotenv = require('dotenv');
const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({path: `${__dirname}/../../config.env`});

const connectToDB = async () => {
    await mongoose.connect(process.env.DATABASE, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
}


// READ FROM FILE
const toursFromFile = fs.readFileSync(`${__dirname}/tours.json`, 'utf-8');
const usersFromFile = fs.readFileSync(`${__dirname}/users.json`, 'utf-8');
const reviewsFromFile = fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8');
// IMPORT DATA

const importData = async () => {
    try{
        const parsedTours = JSON.parse(toursFromFile);
        await Tour.create(parsedTours);

        const parsedUsers = JSON.parse(usersFromFile);
        await User.create(parsedUsers);

        const parsedReviews = JSON.parse(reviewsFromFile);
        await Review.create(parsedReviews);
        console.log('Data successfully loaded');
        process.exit();
    }catch(err){
        console.log(err);
    }
}

// DELETE FROM THE DATABASE

const deleteData = async () => {
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data successfully deleted');
        process.exit();
    }catch(err){
        console.log(err);
    }
}

// EXECUTE BASED ON THE COMMAND
const flag = process.argv[2];
if(flag === '--import'){
    importData();
}else if(flag === '--delete'){
    deleteData();
}

connectToDB();