import { RateMyProfessor } from "rate-my-professor-api-ts";

// accepts only 1 parameter
// which is the name of the college of interest
(async function main() {
    const rmp_instance = new RateMyProfessor("City College of New York");
 
    // one asynchronous method helps retrieve information reagrding college
 
    // method takes in a boolean
    // if boolean is set to true, similar matching named college info will be returned
    // if boolean is set to false, only, the specific college will be returned
    //
    let college_info = await rmp_instance.get_college_info(false);
    let college_info_all = await rmp_instance.get_college_info(true);
 
   
    console.log(college_info);
    console.log(college_info_all);
 })();