import { RateMyProfessor } from "rate-my-professor-api-ts";
// https://www.ratemyprofessors.com/professor/legacyId

(async function main() {
    const rmp_instance = new RateMyProfessor("Arizona State University", "Soumya Indela");

    console.log(await rmp_instance.get_professor_info());
})();

// Message handler moved to background.ts