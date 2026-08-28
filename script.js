"use strict";


/* =========================================
   ELEMENTS
========================================= */

const video =
    document.getElementById("video");

const cameraButton =
    document.getElementById("cameraButton");

const startButton =
    document.getElementById("startButton");

const statusText =
    document.getElementById("status");

const cameraStatus =
    document.getElementById("cameraStatus");

const countdown =
    document.getElementById("countdown");

const countdownNumber =
    document.getElementById("countdownNumber");

const flash =
    document.getElementById("flash");

const resultSection =
    document.getElementById("resultSection");

const resultGrid =
    document.getElementById("resultGrid");

const resultFrame =
    document.getElementById("resultFrame");

const downloadButton =
    document.getElementById("downloadButton");

const retakeButton =
    document.getElementById("retakeButton");


/* =========================================
   VARIABLES
========================================= */

let stream = null;

let photos = [];

let isTakingPhotos = false;


/* =========================================
   DEFAULT DATE
========================================= */

const now = new Date();

const yyyy =
    now.getFullYear();

const mm =
    String(now.getMonth() + 1)
        .padStart(2, "0");

const dd =
    String(now.getDate())
        .padStart(2, "0");

document.getElementById("date").value =
    `${yyyy}-${mm}-${dd}`;


/* =========================================
   CAMERA
========================================= */

cameraButton.addEventListener(
    "click",
    startCamera
);


async function startCamera() {

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        setStatus(
            "❌ Browser tidak mendukung akses kamera."
        );

        return;

    }


    try {

        setStatus(
            "⏳ Meminta izin kamera..."
        );


        if (stream) {

            stream
                .getTracks()
                .forEach(track =>
                    track.stop()
                );

        }


        stream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {
                        facingMode: "user",
                        width: {
                            ideal: 1280
                        },
                        height: {
                            ideal: 720
                        }
                    },

                    audio: false

                });


        video.srcObject =
            stream;


        await video.play();


        cameraStatus.textContent =
            "● CAMERA READY";


        cameraButton.textContent =
            "✓ Kamera Aktif";


        startButton.disabled =
            false;


        setStatus(
            "📸 Kamera siap. Pilih layout lalu mulai!"
        );


    } catch (error) {

        console.error(error);


        stream = null;

        startButton.disabled =
            true;


        let message =
            "❌ Kamera tidak dapat digunakan.";


        if (
            error.name ===
            "NotAllowedError"
        ) {

            message =
                "❌ Izin kamera ditolak. Izinkan kamera di browser.";

        }

        else if (
            error.name ===
            "NotFoundError"
        ) {

            message =
                "❌ Kamera tidak ditemukan.";

        }

        else if (
            error.name ===
            "NotReadableError"
        ) {

            message =
                "❌ Kamera sedang dipakai aplikasi lain.";

        }

        else if (
            error.name ===
            "SecurityError"
        ) {

            message =
                "❌ Browser memblokir akses kamera.";

        }


        setStatus(message);

    }

}


/* =========================================
   START PHOTOBOX
========================================= */

startButton.addEventListener(
    "click",
    startPhotobox
);


async function startPhotobox() {

    if (isTakingPhotos)
        return;


    if (!stream) {

        await startCamera();

        if (!stream)
            return;

    }


    if (
        video.readyState <
        HTMLMediaElement.HAVE_CURRENT_DATA
    ) {

        setStatus(
            "⏳ Tunggu kamera siap..."
        );

        await sleep(1000);

    }


    const layout =
        document.getElementById(
            "layout"
        ).value;


    const [columns, rows] =
        layout
            .split("x")
            .map(Number);


    const total =
        columns * rows;


    photos = [];

    isTakingPhotos = true;

    startButton.disabled = true;

    cameraButton.disabled = true;


    resultSection.style.display =
        "none";


    setStatus(
        `📸 Bersiap mengambil ${total} foto...`
    );


    await sleep(700);


    try {

        for (
            let i = 0;
            i < total;
            i++
        ) {

            setStatus(
                `📸 Foto ${i + 1} dari ${total}`
            );


            await countdownTimer();


            const photo =
                takePhoto();


            photos.push(photo);


            await sleep(600);

        }


        buildResult();


        setStatus(
            "🎉 Selesai! Hasil fotomu sudah siap."
        );


    } catch (error) {

        console.error(error);

        setStatus(
            "❌ Terjadi masalah saat mengambil foto."
        );

    }


    isTakingPhotos = false;

    startButton.disabled = false;

    cameraButton.disabled = false;

}


/* =========================================
   COUNTDOWN
========================================= */

function countdownTimer() {

    return new Promise(resolve => {

        countdown.style.display =
            "flex";


        let number = 3;


        showCountdown(number);


        const timer =
            setInterval(() => {

                number--;


                if (number <= 0) {

                    clearInterval(timer);

                    countdown.style.display =
                        "none";

                    resolve();

                } else {

                    showCountdown(number);

                }

            }, 1000);

    });

}


function showCountdown(number) {

    countdownNumber.textContent =
        number;


    countdownNumber.style.animation =
        "none";


    void countdownNumber.offsetWidth;


    countdownNumber.style.animation =
        "pop .7s ease";

}


/* =========================================
   TAKE PHOTO
========================================= */

function takePhoto() {

    if (
        !video.videoWidth ||
        !video.videoHeight
    ) {

        throw new Error(
            "Video belum siap."
        );

    }


    const canvas =
        document.createElement("canvas");


    canvas.width =
        video.videoWidth;

    canvas.height =
        video.videoHeight;


    const ctx =
        canvas.getContext("2d");


    /*
       Mirror kamera agar hasil
       sesuai tampilan selfie.
    */

    ctx.save();

    ctx.translate(
        canvas.width,
        0
    );

    ctx.scale(
        -1,
        1
    );


    ctx.filter =
        getFilter();


    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.restore();


    // Flash

    flash.classList.remove("flash");

    void flash.offsetWidth;

    flash.classList.add("flash");


    return canvas.toDataURL(
        "image/jpeg",
        0.94
    );

}


/* =========================================
   FILTER
========================================= */

function getFilter() {

    const value =
        document.getElementById(
            "filter"
        ).value;


    switch (value) {

        case "soft":
            return "brightness(1.08) saturate(1.12)";

        case "vintage":
            return "sepia(.55) contrast(1.04)";

        case "bw":
            return "grayscale(1)";

        case "vivid":
            return "contrast(1.12) saturate(1.3)";

        default:
            return "none";

    }

}


/* =========================================
   BUILD RESULT
========================================= */

function buildResult() {

    const layout =
        document.getElementById(
            "layout"
        ).value;


    const [columns, rows] =
        layout
            .split("x")
            .map(Number);


    resultGrid.innerHTML = "";


    resultGrid.style.gridTemplateColumns =
        `repeat(${columns}, 1fr)`;


    resultGrid.style.gridTemplateRows =
        `repeat(${rows}, 1fr)`;


    photos.forEach(photo => {

        const img =
            document.createElement(
                "img"
            );


        img.src =
            photo;

        img.alt =
            "Photobox memory";


        resultGrid.appendChild(
            img
        );

    });


    // TITLE

    document.getElementById(
        "resultTitle"
    ).textContent =

        document.getElementById(
            "title"
        ).value.trim() ||

        "Our Little Moments";


    // NAMES

    const name1 =
        document.getElementById(
            "name1"
        ).value.trim();


    const name2 =
        document.getElementById(
            "name2"
        ).value.trim();


    let names = "You × Me";


    if (name1 && name2) {

        names =
            `${name1} × ${name2}`;

    } else if (name1) {

        names = name1;

    } else if (name2) {

        names = name2;

    }


    document.getElementById(
        "resultNames"
    ).textContent =
        names;


    // MESSAGE

    document.getElementById(
        "resultMessage"
    ).textContent =

        document.getElementById(
            "message"
        ).value.trim() ||

        "Every moment with you is special ♡";


    // DATE

    const dateValue =
        document.getElementById(
            "date"
        ).value;


    if (dateValue) {

        const date =
            new Date(
                `${dateValue}T00:00:00`
            );


        document.getElementById(
            "resultDate"
        ).textContent =

            date.toLocaleDateString(
                "id-ID",
                {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );

    }


    // FRAME

    const frame =
        document.getElementById(
            "frame"
        ).value;


    resultFrame.className =
        `result-frame ${frame}`;


    resultSection.style.display =
        "block";


    setTimeout(() => {

        resultSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 200);

}


/* =========================================
   DOWNLOAD
========================================= */

downloadButton.addEventListener(
    "click",
    downloadResult
);


async function downloadResult() {

    if (!photos.length) {

        alert(
            "Belum ada hasil foto."
        );

        return;

    }


    try {

        setStatus(
            "⏳ Menyiapkan foto..."
        );


        const blob =
            await createFinalImage();


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;


        const name1 =
            document
                .getElementById("name1")
                .value
                .trim()
                .replace(
                    /[^a-zA-Z0-9-_]/g,
                    ""
                );


        const name2 =
            document
                .getElementById("name2")
                .value
                .trim()
                .replace(
                    /[^a-zA-Z0-9-_]/g,
                    ""
                );


        const filename =
            name1 && name2
                ? `LoveBox-${name1}-${name2}.jpg`
                : "LoveBox-Photobox.jpg";


        link.download =
            filename;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(() => {

            URL.revokeObjectURL(
                url
            );

        }, 1000);


        setStatus(
            "💾 Foto berhasil disimpan sebagai JPG!"
        );


    } catch (error) {

        console.error(error);

        setStatus(
            "❌ Gagal membuat file JPG."
        );

    }

}


/* =========================================
   CREATE FINAL CANVAS
========================================= */

async function createFinalImage() {

    const layout =
        document.getElementById(
            "layout"
        ).value;


    const [columns, rows] =
        layout
            .split("x")
            .map(Number);


    const WIDTH =
        1600;


    const PADDING =
        90;


    const HEADER =
        230;


    const FOOTER =
        190;


    const GAP =
        8;


    const cellWidth =
        (
            WIDTH -
            PADDING * 2 -
            GAP * (columns - 1)
        ) / columns;


    const cellHeight =
        cellWidth;


    const gridHeight =
        cellHeight * rows +
        GAP * (rows - 1);


    const HEIGHT =
        PADDING +
        HEADER +
        gridHeight +
        FOOTER +
        PADDING;


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        WIDTH;

    canvas.height =
        HEIGHT;


    const ctx =
        canvas.getContext("2d");


    // BACKGROUND

    ctx.fillStyle =
        getFrameColor();


    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    const textColor =
        getTextColor();


    ctx.fillStyle =
        textColor;


    ctx.textAlign =
        "center";


    // TITLE

    const title =
        document.getElementById(
            "title"
        ).value.trim();


    ctx.font =
        "bold 56px Georgia";


    ctx.fillText(
        title || "Our Little Moments",
        WIDTH / 2,
        85
    );


    // NAMES

    const name1 =
        document.getElementById(
            "name1"
        ).value.trim();


    const name2 =
        document.getElementById(
            "name2"
        ).value.trim();


    let names = "You × Me";


    if (name1 && name2) {

        names =
            `${name1} × ${name2}`;

    } else if (name1) {

        names = name1;

    } else if (name2) {

        names = name2;

    }


    ctx.font =
        "30px Arial";


    ctx.fillText(
        names,
        WIDTH / 2,
        140
    );


    // IMAGES

    const images =
        await Promise.all(
            photos.map(loadImage)
        );


    images.forEach(
        (img, index) => {

            const column =
                index % columns;


            const row =
                Math.floor(
                    index / columns
                );


            const x =
                PADDING +
                column *
                (cellWidth + GAP);


            const y =
                PADDING +
                HEADER +
                row *
                (cellHeight + GAP);


            drawCrop(
                ctx,
                img,
                x,
                y,
                cellWidth,
                cellHeight
            );

        }
    );


    // MESSAGE

    const message =
        document.getElementById(
            "message"
        ).value.trim();


    ctx.font =
        "italic 32px Georgia";


    ctx.fillText(
        message ||
        "Every moment with you is special ♡",
        WIDTH / 2,
        HEIGHT - 95
    );


    // DATE

    const dateValue =
        document.getElementById(
            "date"
        ).value;


    if (dateValue) {

        const date =
            new Date(
                `${dateValue}T00:00:00`
            );


        ctx.font =
            "21px Arial";


        ctx.fillText(

            date.toLocaleDateString(
                "id-ID",
                {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            ),

            WIDTH / 2,
            HEIGHT - 50

        );

    }


    // DECORATIVE HEARTS

    ctx.font =
        "48px Arial";


    ctx.fillText(
        "♥",
        50,
        75
    );


    ctx.fillText(
        "♥",
        WIDTH - 50,
        HEIGHT - 45
    );


    return new Promise(
        resolve => {

            canvas.toBlob(
                blob =>
                    resolve(blob),
                "image/jpeg",
                .95
            );

        }
    );

}


/* =========================================
   IMAGE HELPERS
========================================= */

function loadImage(src) {

    return new Promise(
        (resolve, reject) => {

            const img =
                new Image();


            img.onload =
                () => resolve(img);


            img.onerror =
                () => reject(
                    new Error(
                        "Foto gagal dimuat."
                    )
                );


            img.src = src;

        }
    );

}


function drawCrop(
    ctx,
    img,
    x,
    y,
    width,
    height
) {

    const imageRatio =
        img.width / img.height;


    const targetRatio =
        width / height;


    let sourceWidth =
        img.width;


    let sourceHeight =
        img.height;


    let sourceX = 0;

    let sourceY = 0;


    if (imageRatio > targetRatio) {

        sourceWidth =
            img.height *
            targetRatio;


        sourceX =
            (img.width -
                sourceWidth) / 2;

    }

    else {

        sourceHeight =
            img.width /
            targetRatio;


        sourceY =
            (img.height -
                sourceHeight) / 2;

    }


    ctx.drawImage(

        img,

        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,

        x,
        y,
        width,
        height

    );

}


/* =========================================
   FRAME COLORS
========================================= */

function getFrameColor() {

    switch (
        document
            .getElementById("frame")
            .value
    ) {

        case "white":
            return "#ffffff";

        case "purple":
            return "#eadcff";

        case "blue":
            return "#dff4ff";

        case "red":
            return "#ffd5dd";

        case "black":
            return "#171717";

        default:
            return "#ffdce8";

    }

}


function getTextColor() {

    return document
        .getElementById("frame")
        .value === "black"

        ? "#ffffff"

        : "#542533";

}


/* =========================================
   RETAKE
========================================= */

retakeButton.addEventListener(
    "click",
    () => {

        photos = [];


        resultGrid.innerHTML = "";


        resultSection.style.display =
            "none";


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


        setStatus(
            "📸 Siap mengambil foto lagi!"
        );

    }
);


/* =========================================
   UTILITY
========================================= */

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


function setStatus(message) {

    statusText.textContent =
        message;

}


/* =========================================
   CLEAN CAMERA WHEN LEAVING
========================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (stream) {

            stream
                .getTracks()
                .forEach(track =>
                    track.stop()
                );

        }

    }
);
