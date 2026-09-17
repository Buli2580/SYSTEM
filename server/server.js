require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const OpenAI = require("openai");
const { toFile } = require("openai");

const app = express();

const PORT =
  process.env.PORT || 3000;

const openai =
  new OpenAI({
    apiKey:
      process.env.OPENAI_API_KEY,
  });

app.use(cors());

app.use(
  express.json({
    limit: "10mb",
  })
);

const generatedDir =
  path.join(
    __dirname,
    "generated"
  );

if (
  !fs.existsSync(
    generatedDir
  )
) {
  fs.mkdirSync(
    generatedDir,
    {
      recursive: true,
    }
  );
}

app.use(
  "/generated",
  express.static(
    generatedDir
  )
);

const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        12 *
        1024 *
        1024,
    },
  });

function classPrompt(
  playerClass
) {
  switch (
    playerClass
  ) {
    case "TITAN":
      return `
Potężny wojownik typu Tytan.
Masywny futurystyczno-fantasy pancerz.
Silna sylwetka.
Ciężka energia.
Pomarańczowo-czerwona aura.
Wygląd elitarnego wojownika.
`;

    case "SCHOLAR":
      return `
Uczony i poszukiwacz wiedzy.
Elegancki magiczno-technologiczny strój.
Subtelne świecące symbole danych i run.
Niebiesko-fioletowa energia.
Inteligentny i potężny wygląd.
`;

    case "ARCHITECT":
      return `
Strateg i budowniczy imperium.
Elegancki ciemny futurystyczny strój.
Elementy złota i czerni.
Technologiczny HUD w tle.
Aura kontroli, władzy i strategii.
`;

    case "SHADOW":
      return `
Mroczny specjalista dyscypliny.
Czarny lekki pancerz.
Subtelny kaptur lub wysoki kołnierz.
Niebiesko-fioletowa energia.
Cienie i świetliste cząsteczki.
`;

    case "HUNTER":
    default:
      return `
Wszechstronny Łowca.
Ciemny lekki pancerz bojowy.
Elegancki miecz lub futurystyczna broń przy boku.
Błękitna aura.
Wygląd szybkiego i elitarnego wojownika.
`;
  }
}

function stylePrompt(
  style
) {
  switch (
    style
  ) {
    case "CYBER":
      return `
Styl CYBER SYSTEM.
Futurystyczny świat.
Neonowy HUD.
Zaawansowany pancerz technologiczny.
Cyjanowe światła.
Ciemne industrialne tło.
Filmowe oświetlenie.
`;

    case "WARLORD":
      return `
Styl WŁADCA.
Majestatyczny elitarny wojownik.
Bogaty i potężny pancerz.
Monumentalna atmosfera.
Silna aura.
Filmowe fantasy science-fiction.
`;

    case "DARK":
    default:
      return `
Styl MROCZNY ŁOWCA.
Dark fantasy science-fiction.
Ciemne tło.
Czarny pancerz.
Błękitne światło.
Energetyczna aura.
Dramatyczne filmowe oświetlenie.
`;
  }
}

function evolutionPrompt(
  level
) {
  if (
    level >= 50
  ) {
    return `
Forma monarchy.
Ekstremalnie potężna aura.
Najwyższej klasy legendarny pancerz.
Postać wygląda jak władca końcowej fazy gry.
`;
  }

  if (
    level >= 40
  ) {
    return `
Forma mistrzowska.
Bardzo zaawansowany pancerz.
Silna, stabilna aura.
`;
  }

  if (
    level >= 30
  ) {
    return `
Forma elitarna.
Wyraźnie ulepszony pancerz.
Silna aura i więcej energii.
`;
  }

  if (
    level >= 20
  ) {
    return `
Forma wyniesiona.
Zaawansowany strój bojowy.
Wyraźna aura.
`;
  }

  if (
    level >= 10
  ) {
    return `
Forma awangardy.
Lepszy pancerz.
Widoczna aura energii.
`;
  }

  if (
    level >= 5
  ) {
    return `
Forma przebudzona.
Lekki pancerz.
Subtelna aura.
`;
  }

  return `
Forma początkowa.
Stosunkowo prosty strój.
Subtelna uśpiona aura.
Nie przesadzaj z pancerzem.
`;
}

function buildPrompt({
  playerClass,
  style,
  level,
  rank,
}) {
  return `
Przekształć osobę z dostarczonego zdjęcia
w oryginalną postać do aplikacji RPG SYSTEM.

NAJWAŻNIEJSZE:
Zachowaj rozpoznawalną tożsamość osoby ze zdjęcia.
Zachowaj jej rysy twarzy.
Zachowaj kształt twarzy.
Zachowaj kolor skóry.
Zachowaj charakterystyczne cechy twarzy.
Nie zamieniaj jej w inną osobę.
Nie odmładzaj ani nie postarzaj znacząco.
Twarz ma pozostać realistyczna i bardzo podobna
do zdjęcia wejściowego.

Postać od pasa lub klatki piersiowej w górę.
Portret pionowy.
Centralna kompozycja.
Profesjonalny wygląd gry RPG.
Bardzo wysoka jakość.
Realistyczne materiały.
Filmowe światło.
Bez tekstu.
Bez logotypów.
Bez znaków wodnych.
Bez istniejących postaci z filmów, anime lub gier.
Projekt ma być całkowicie oryginalny.

KLASA:
${classPrompt(
  playerClass
)}

STYL:
${stylePrompt(
  style
)}

ROZWÓJ:
${evolutionPrompt(
  Number(level) || 1
)}

Poziom gracza:
${level || 1}

Ranga:
${rank || "E"}

Tło powinno być ciemne,
ale postać i twarz muszą być dobrze widoczne.

Rezultat ma wyglądać jak premium
profil bohatera w nowoczesnej grze RPG.
`;
}

app.get(
  "/health",
  (
    req,
    res
  ) => {
    res.json({
      ok: true,
      service:
        "SYSTEM AVATAR",
    });
  }
);

app.post(
  "/api/generate-avatar",

  upload.single(
    "avatar"
  ),

  async (
    req,
    res
  ) => {
    try {
      if (
        !process.env
          .OPENAI_API_KEY
      ) {
        return res
          .status(500)
          .json({
            error:
              "Brak OPENAI_API_KEY",
          });
      }

      if (
        !req.file
      ) {
        return res
          .status(400)
          .json({
            error:
              "Brak zdjęcia",
          });
      }

      const {
        playerClass =
          "HUNTER",

        style =
          "DARK",

        level =
          "1",

        rank =
          "E",
      } = req.body;

      console.log(
        "GENEROWANIE AVATARA:",
        {
          playerClass,
          style,
          level,
          rank,
          size:
            req.file.size,
        }
      );

      const image =
        await toFile(
          req.file.buffer,

          req.file
            .originalname ||
            "avatar.jpg",

          {
            type:
              req.file
                .mimetype ||
              "image/jpeg",
          }
        );

      const prompt =
        buildPrompt({
          playerClass,
          style,
          level,
          rank,
        });

      const response =
        await openai.images.edit({
          model:
            "gpt-image-2.5-sunburst",

          image: [
            image,
          ],

          prompt,

          size:
            "1024x1536",

          quality:
            "medium",
        });

      const base64 =
        response.data?.[0]
          ?.b64_json;

      if (
        !base64
      ) {
        throw new Error(
          "Generator nie zwrócił obrazu"
        );
      }

      const filename =
        `avatar-${Date.now()}.png`;

      const filepath =
        path.join(
          generatedDir,
          filename
        );

      fs.writeFileSync(
        filepath,
        Buffer.from(
          base64,
          "base64"
        )
      );

      const imageUrl =
        `${req.protocol}://${req.get(
          "host"
        )}/generated/${filename}`;

      console.log(
        "AVATAR GOTOWY:",
        imageUrl
      );

      res.json({
        success: true,

        imageUrl,

        style,

        playerClass,
      });
    } catch (error) {
      console.error(
        "AVATAR ERROR:"
      );

      console.error(
        error
      );

      const message =
        error?.message ||
        "Nieznany błąd generatora";

      res
        .status(500)
        .json({
          success:
            false,

          error:
            message,
        });
    }
  }
);

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      ""
    );

    console.log(
      "=============================="
    );

    console.log(
      "SYSTEM AVATAR SERVER"
    );

    console.log(
      `PORT: ${PORT}`
    );

    console.log(
      "MODEL: GPT IMAGE 2.5"
    );

    console.log(
      "=============================="
    );

    console.log(
      ""
    );
  }
);