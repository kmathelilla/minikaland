
from typing import Literal

SkillName = Literal[
    "montessori",
    "fejleszto",
    "kreativ",
    "mozgasos",
]

SKILLS: dict[SkillName, str] = {
    "montessori": (
        "Montessori pedagógiai szemlélet alapján tervezz. "
        "A gyermek önálló felfedezését, érzékszervi tapasztalását "
        "és gyakorlati készségeit támogasd. "
        "Használj hétköznapi, életkornak megfelelő eszközöket. "
        "Az eszközök csak olyan anyagokból készülhetnek, "
        "amelyek nem jelentenek veszélyt a gyermekre és megfelelnek a Montessori elveknek. "
    ),
    "fejleszto": (
        "A játék fejlessze a figyelmet, memóriát, logikai "
        "gondolkodást vagy beszédkészséget. "
        "A feladat legyen játékos és sikerélményt adó. "
        "A játék során a gyermeknek lehetősége legyen új készségek elsajátítására, "
        "amely életkorának megfelelően kihívást jelent, de nem frusztráló. "
    ),
    "kreativ": (
        "Ösztönözd a képzeletet, alkotást és önkifejezést. "
        "Ne legyen egyetlen kötelező jó megoldás. "
        "Engedj teret az egyéni ötleteknek. "
        "A játék során a gyermeknek lehetősége legyen új, kreatív készségek elsajátítására, "
        "amely életkorának megfelelően kihívást jelent, de nem frusztráló. "
    ),
    "mozgasos": (
        "Támogasd a nagymozgásokat, koordinációt és egyensúlyt. "
        "A mozgás legyen biztonságos, beltérben is végezhető, "
        "és az életkorhoz igazodó. "
        "Mozgás során az adott mozgáselemek valamelyikéhez adjunk "
        "mondóka vagy dalocska lehetőséget, hogy a gyermek figyelmét és ritmusérzékét is fejlessze. "
    ),
}


def build_skill_instructions(
    selected_skills: list[SkillName] | None,
) -> str:
    unique_skills = list(dict.fromkeys(selected_skills or []))
    if not unique_skills:
        return (
            "Általános, játékos, életkornak megfelelő "
            "gyermektevékenységet tervezz."
        )

    instructions = [
        SKILLS[skill]
        for skill in unique_skills
    ]

    return "\n".join(instructions)
