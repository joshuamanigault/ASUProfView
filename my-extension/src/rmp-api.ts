import { RateMyProfessor } from "rate-my-professor-api-ts";
// https://www.ratemyprofessors.com/professor/legacyId

(async function main() {
    const rmp_instance = new RateMyProfessor("Arizona State University", "Darryl Reano");

    console.log(await rmp_instance.get_professor_info());
})();