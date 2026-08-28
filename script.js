"use strict";


/* =====================================================
   LOVEBOX PHOTOBOOTH
   No external library required.
===================================================== */


/* =====================================================
   ELEMENTS
===================================================== */

const video =
    document.getElementById("video");

const cameraButton =
    document.getElementById("cameraButton");

const switchButton =
    document.getElementById("switchButton");

const startButton =
    document.getElementById("startButton");

const status =
    document.getElementById("status");

const cameraStatus =
    document.getElementById("cameraStatus");

const placeholder =
    document.getElementById("cameraPlaceholder");

const flash =
    document.getElementById("flash");

const countdown =
    document.getElementById("countdown");

const countdownNumber =
    document.getElementById("countdownNumber");

const result =
    document.getElementById("result");

const paper =
    document.getElementById("paper");

const photoGrid =
    document.getElementById("photoGrid");

const saveStatus =
    document.getElementById("saveStatus");


/* =====================================================
   STATE
===================================================== */

let stream = null;

let facingMode = "user";

let photos = [];

let busy = false;

let finalBlob = null;

let finalURL = null;


/* =====================================================
   LAYOUTS
===================================================== */

const layouts = {

    "1x1": [1, 1],

    "2x1": [2, 1],

    "2x2": [2, 2],

    "3x2": [3, 2],

    "3x3": [3, 3],

    "4x2": [4, 2],

    "4x3": [4, 3],

    "4x4": [4, 4],

    "5x2": [5, 2],

    "5x3": [5, 3],

    "6x2": [6, 2],

    "6x3": [6, 3],

    "6x6": [6, 6]

};


/* =====================================================
   FILTERS
===================================================== */

const filters = {

    normal:
        "none",

    soft:
        "brightness(1.06) saturate(1.08)",

    vintage:
        "sepia(.48) contrast(1.03)",

    bw:
        "grayscale(1)",

    vivid:
        "contrast(1.1) saturate(1.3)",

    cool:
        "contrast(1.03) saturate(1.05) hue-rotate(8deg)",

    warm:
        "sepia(.12) saturate(1.15) brightness(1.03)"

};


/* =====================================================
   FRAME THEMES
===================================================== */

const frameThemes = {

    pink: "theme-pink",

    white: "theme-white",

    black: "theme-black",

    purple: "theme-purple",

    blue: "theme-blue",

    red: "theme-red",

    cream: "theme-cream",

    mint: "theme-mint",

    sunset: "theme-sunset",

    night: "theme-night",

    polaroid: "theme-polaroid",

    film: "theme-film",

    newspaper: "theme-newspaper",

    checker: "theme-checker",

    rainbow: "theme-rainbow"

};


/* =====================================================
   HELPERS
===================================================== */

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


function setStatus(text) {

    status.textContent =
        text;

}


function setSaveStatus(text) {

    saveStatus.textContent =
        text;

}


/* =====================================================
   DATE
===================================================== */

function setToday() {

    const date =
        new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    document.getElementById(
        "date"
    ).value =
        `${year}-${month}-${day}`;

}


setToday();


/* =====================================================
   LAYOUT PREVIEW
===================================================== */

function updateLayoutInfo() {

    const value =
        document.getElementById(
            "layout"
        ).value;


    const [columns, rows] =
        layouts[value];


    document.getElementById(
        "layoutInfo"
    ).textContent =
        `${columns} × ${rows} • ${columns * rows} foto`;

}


document
    .getElementById("layout")
    .addEventListener(
        "change",
        updateLayoutInfo
    );


updateLayoutInfo();


/* =====================================================
   START CAMERA
===================================================== */

async function startCamera() {

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        setStatus(
            "❌ Kamera tidak tersedia. Gunakan GitHub Pages / HTTPS."
        );

        return false;

    }


    await stopCamera();


    try {

        setStatus(
            "⏳ Meminta izin kamera..."
        );


        stream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        facingMode: {
                            ideal:
                                facingMode
                        },

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


        placeholder.style.display =
            "none";


        cameraStatus.textContent =
            facingMode === "user"

                ? "● FRONT CAMERA"

                : "● BACK CAMERA";


        cameraButton.textContent =
            "✓ Kamera Aktif";


        switchButton.disabled =
            false;


        startButton.disabled =
            false;


        setStatus(
            "📸 Kamera siap! Pilih layout lalu mulai."
        );


        return true;


    } catch (error) {

        console.error(error);


        await stopCamera();


        switchButton.disabled =
            true;


        startButton.disabled =
            true;


        if (
            error.name ===
            "NotAllowedError"
        ) {

            setStatus(
                "❌ Izin kamera ditolak. Izinkan kamera untuk website ini."
            );

        }

        else if (
            error.name ===
            "NotFoundError"
        ) {

            setStatus(
                "❌ Kamera tidak ditemukan."
            );

        }

        else if (
            error.name ===
            "NotReadableError"
        ) {

            setStatus(
                "❌ Kamera sedang digunakan aplikasi lain."
            );

        }

        else {

            setStatus(
                "❌ Kamera gagal dibuka. Pastikan menggunakan HTTPS."
            );

        }


        return false;

    }

}


/* =====================================================
   STOP CAMERA
===================================================== */

async function stopCamera() {

    if (!stream)
        return;


    stream
        .getTracks()
        .forEach(
            track =>
                track.stop()
        );


    stream = null;

}


/* =====================================================
   CAMERA BUTTON
===================================================== */

cameraButton.addEventListener(
    "click",
    async () => {

        await startCamera();

    }
);


/* =====================================================
   SWITCH CAMERA
===================================================== */

switchButton.addEventListener(
    "click",
    async () => {

        if (busy)
            return;


        facingMode =
            facingMode === "user"
                ? "environment"
                : "user";


        const success =
            await startCamera();


        if (!success) {

            facingMode =
                facingMode === "user"
                    ? "environment"
                    : "user";

        }

    }
);


/* =====================================================
   COUNTDOWN
===================================================== */

function countdownTimer() {

    return new Promise(
        resolve => {

            countdown.classList.add(
                "show"
            );


            let number = 3;


            function tick() {

                countdownNumber.textContent =
                    number;


                countdownNumber.style.animation =
                    "none";


                void
                    countdownNumber
                        .offsetWidth;


                countdownNumber.style.animation =
                    "countdownPop .65s ease";


                if (number === 0) {

                    countdown.classList.remove(
                        "show"
                    );


                    resolve();

                    return;

                }


                number--;


                setTimeout(
                    tick,
                    900
                );

            }


            tick();

        }
    );

}


/* =====================================================
   TAKE PHOTO
===================================================== */

function takePhoto() {

    if (
        !video.videoWidth ||
        !video.videoHeight
    ) {

        throw new Error(
            "Kamera belum siap."
        );

    }


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        video.videoWidth;


    canvas.height =
        video.videoHeight;


    const ctx =
        canvas.getContext(
            "2d"
        );


    /*
        Mirror hasil selfie
        agar sama seperti preview.
    */

    ctx.save();


    if (
        facingMode === "user"
    ) {

        ctx.translate(
            canvas.width,
            0
        );


        ctx.scale(
            -1,
            1
        );

    }


    ctx.filter =
        filters[
            document.getElementById(
                "filter"
            ).value
        ] || "none";


    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.restore();


    flash.classList.remove(
        "active"
    );


    void flash.offsetWidth;


    flash.classList.add(
        "active"
    );


    return canvas.toDataURL(
        "image/jpeg",
        0.94
    );

}


/* =====================================================
   START PHOTOBOX
===================================================== */

async function startPhotobox() {

    if (busy)
        return;


    if (!stream) {

        const success =
            await startCamera();


        if (!success)
            return;

    }


    if (
        video.readyState <
        HTMLMediaElement
            .HAVE_CURRENT_DATA
    ) {

        setStatus(
            "⏳ Menunggu kamera..."
        );


        await sleep(600);

    }


    const layout =
        document.getElementById(
            "layout"
        ).value;


    const [
        columns,
        rows
    ] =
        layouts[layout];


    const total =
        columns * rows;


    /*
        36 foto memerlukan waktu
        cukup lama, jadi konfirmasi.
    */

    if (total >= 24) {

        const answer =
            confirm(
                `Layout ${columns} × ${rows} membutuhkan ${total} foto. Lanjutkan?`
            );


        if (!answer)
            return;

    }


    busy = true;


    photos = [];


    finalBlob = null;


    startButton.disabled =
        true;


    switchButton.disabled =
        true;


    cameraButton.disabled =
        true;


    result.style.display =
        "none";


    setStatus(
        `📸 Bersiap mengambil ${total} foto...`
    );


    await sleep(600);


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


            photos.push(
                photo
            );


            await sleep(450);

        }


        renderResult();


        setStatus(
            "🎉 Selesai! Hasil photobox siap."
        );


    } catch (error) {

        console.error(error);


        setStatus(
            "❌ Terjadi kesalahan saat mengambil foto."
        );

    }


    busy = false;


    startButton.disabled =
        false;


    switchButton.disabled =
        false;


    cameraButton.disabled =
        false;

}


startButton.addEventListener(
    "click",
    startPhotobox
);


/* =====================================================
   USER DATA
===================================================== */

function clean(value) {

    return String(
        value || ""
    ).trim();

}


function getNames() {

    const name1 =
        clean(
            document.getElementById(
                "name1"
            ).value
        );


    const name2 =
        clean(
            document.getElementById(
                "name2"
            ).value
        );


    if (
        name1 &&
        name2
    ) {

        return (
            `${name1} × ${name2}`
        );

    }


    return (
        name1 ||
        name2 ||
        "You × Me"
    );

}


function getDateText() {

    const value =
        document.getElementById(
            "date"
        ).value;


    if (!value)
        return "";


    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        "id-ID",
        {

            day:
                "numeric",

            month:
                "long",

            year:
                "numeric"

        }
    );

}


/* =====================================================
   RENDER RESULT
===================================================== */

function renderResult() {

    const layout =
        document.getElementById(
            "layout"
        ).value;


    const [
        columns,
        rows
    ] =
        layouts[layout];


    photoGrid.innerHTML =
        "";


    photoGrid.style.gridTemplateColumns =
        `repeat(${columns}, minmax(0, 1fr))`;


    photoGrid.style.gridTemplateRows =
        `repeat(${rows}, minmax(0, 1fr))`;


    photos.forEach(
        (src, index) => {

            const image =
                new Image();


            image.src =
                src;


            image.alt =
                `Foto ${index + 1}`;


            photoGrid.appendChild(
                image
            );

        }
    );


    document.getElementById(
        "resultTitle"
    ).textContent =

        clean(
            document.getElementById(
                "title"
            ).value
        ) ||

        "Our Little Moments";


    document.getElementById(
        "resultNames"
    ).textContent =
        getNames();


    document.getElementById(
        "resultMessage"
    ).textContent =

        clean(
            document.getElementById(
                "message"
            ).value
        ) ||

        "Every moment with you is special ♡";


    document.getElementById(
        "resultDate"
    ).textContent =
        getDateText();


    const frame =
        document.getElementById(
            "frame"
        ).value;


    paper.className =
        "paper " +
        (
            frameThemes[frame] ||
            "theme-pink"
        );


    result.style.display =
        "block";


    setTimeout(
        () => {

            result.scrollIntoView({

                behavior:
                    "smooth",

                block:
                    "start"

            });

        },
        100
    );

}


/* =====================================================
   LIVE RESULT UPDATE
===================================================== */

[
    "name1",
    "name2",
    "title",
    "date",
    "message",
    "frame"
].forEach(
    id => {

        document
            .getElementById(id)
            .addEventListener(
                "input",
                () => {

                    if (
                        photos.length
                    ) {

                        renderResult();

                    }

                }
            );


        document
            .getElementById(id)
            .addEventListener(
                "change",
                () => {

                    if (
                        photos.length
                    ) {

                        renderResult();

                    }

                }
            );

    }
);


/* =====================================================
   LOAD IMAGE
===================================================== */

function loadImage(src) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const image =
                new Image();


            image.onload =
                () =>
                    resolve(
                        image
                    );


            image.onerror =
                () =>
                    reject(
                        new Error(
                            "Foto gagal dimuat."
                        )
                    );


            image.src =
                src;

        }
    );

}


/* =====================================================
   FRAME BACKGROUND
===================================================== */

function drawFrameBackground(
    ctx,
    frame,
    width,
    height
) {

    if (
        frame === "checker"
    ) {

        ctx.fillStyle =
            "#f4dce5";


        ctx.fillRect(
            0,
            0,
            width,
            height
        );


        const size =
            44;


        ctx.fillStyle =
            "#ffffff";


        for (
            let y = 0;
            y < height;
            y += size
        ) {

            for (
                let x = 0;
                x < width;
                x += size
            ) {

                if (
                    (
                        x / size +
                        y / size
                    ) % 2 === 0
                ) {

                    ctx.fillRect(
                        x,
                        y,
                        size,
                        size
                    );

                }

            }

        }


        return;

    }


    if (
        frame === "rainbow"
    ) {

        const gradient =
            ctx.createLinearGradient(
                0,
                0,
                width,
                height
            );


        gradient.addColorStop(
            0,
            "#ffd6e7"
        );


        gradient.addColorStop(
            .25,
            "#ffe9c8"
        );


        gradient.addColorStop(
            .5,
            "#dff6e8"
        );


        gradient.addColorStop(
            .75,
            "#dff0ff"
        );


        gradient.addColorStop(
            1,
            "#eadcff"
        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(
            0,
            0,
            width,
            height
        );


        return;

    }


    if (
        frame === "sunset"
    ) {

        const gradient =
            ctx.createLinearGradient(
                0,
                0,
                width,
                height
            );


        gradient.addColorStop(
            0,
            "#ffd29f"
        );


        gradient.addColorStop(
            1,
            "#ffb5c9"
        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(
            0,
            0,
            width,
            height
        );


        return;

    }


    if (
        frame === "night"
    ) {

        const gradient =
            ctx.createLinearGradient(
                0,
                0,
                width,
                height
            );


        gradient.addColorStop(
            0,
            "#15162d"
        );


        gradient.addColorStop(
            1,
            "#42315f"
        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(
            0,
            0,
            width,
            height
        );


        return;

    }


    const colors = {

        pink:
            "#ffdce8",

        white:
            "#ffffff",

        black:
            "#171717",

        purple:
            "#e9dcff",

        blue:
            "#dff4ff",

        red:
            "#ffd5dd",

        cream:
            "#f1e1c3",

        mint:
            "#dff4e8",

        polaroid:
            "#ffffff",

        film:
            "#151515",

        newspaper:
            "#e9e4d7"

    };


    ctx.fillStyle =
        colors[frame] ||
        "#ffdce8";


    ctx.fillRect(
        0,
        0,
        width,
        height
    );

}


/* =====================================================
   CREATE FINAL JPG
===================================================== */

async function createFinalImage() {

    if (
        !photos.length
    ) {

        throw new Error(
            "Tidak ada foto."
        );

    }


    const layout =
        document.getElementById(
            "layout"
        ).value;


    const [
        columns,
        rows
    ] =
        layouts[layout];


    /*
        Large output resolution.
    */

    const WIDTH =
        1800;


    const PADDING =
        90;


    const HEADER =
        240;


    const FOOTER =
        215;


    const GAP =
        8;


    const cellWidth =

        (
            WIDTH -
            PADDING * 2 -
            GAP * (
                columns - 1
            )
        ) / columns;


    const cellHeight =
        cellWidth;


    const gridHeight =

        cellHeight *
        rows +

        GAP *
        (
            rows - 1
        );


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
        canvas.getContext(
            "2d"
        );


    const frame =
        document.getElementById(
            "frame"
        ).value;


    drawFrameBackground(
        ctx,
        frame,
        WIDTH,
        HEIGHT
    );


    /*
        Text color.
    */

    const lightFrame =
        [
            "black",
            "night",
            "film"
        ].includes(frame);


    const textColor =
        lightFrame
            ? "#ffffff"
            : "#542533";


    ctx.fillStyle =
        textColor;


    ctx.textAlign =
        "center";


    /*
        TITLE
    */

    ctx.font =
        "700 64px Georgia";


    ctx.fillText(

        clean(
            document.getElementById(
                "title"
            ).value
        ) ||

        "Our Little Moments",

        WIDTH / 2,

        95

    );


    /*
        NAMES
    */

    ctx.font =
        "32px Arial";


    ctx.fillText(

        getNames(),

        WIDTH / 2,

        150

    );


    /*
        PHOTOS
    */

    const images =
        await Promise.all(
            photos.map(
                loadImage
            )
        );


    images.forEach(
        (
            image,
            index
        ) => {

            const column =
                index % columns;


            const row =
                Math.floor(
                    index / columns
                );


            const x =

                PADDING +

                column *
                (
                    cellWidth +
                    GAP
                );


            const y =

                PADDING +
                HEADER +

                row *
                (
                    cellHeight +
                    GAP
                );


            /*
                Square crop.
            */

            const ratio =
                image.width /
                image.height;


            let sourceWidth =
                image.width;


            let sourceHeight =
                image.height;


            let sourceX = 0;

            let sourceY = 0;


            if (
                ratio > 1
            ) {

                sourceWidth =
                    image.height;


                sourceX =
                    (
                        image.width -
                        sourceWidth
                    ) / 2;

            }

            else {

                sourceHeight =
                    image.width;


                sourceY =
                    (
                        image.height -
                        sourceHeight
                    ) / 2;

            }


            ctx.drawImage(

                image,

                sourceX,
                sourceY,

                sourceWidth,
                sourceHeight,

                x,
                y,

                cellWidth,
                cellHeight

            );


            /*
                Film side strips.
            */

            if (
                frame === "film"
            ) {

                ctx.fillStyle =
                    "#000";


                const strip =
                    Math.min(
                        18,
                        cellWidth * .04
                    );


                ctx.fillRect(
                    x,
                    y,
                    strip,
                    cellHeight
                );


                ctx.fillRect(
                    x +
                    cellWidth -
                    strip,

                    y,

                    strip,

                    cellHeight
                );


                ctx.fillStyle =
                    textColor;

            }

        }
    );


    /*
        MESSAGE
    */

    ctx.font =
        "italic 34px Georgia";


    ctx.fillText(

        clean(
            document.getElementById(
                "message"
            ).value
        ) ||

        "Every moment with you is special ♡",

        WIDTH / 2,

        HEIGHT - 105

    );


    /*
        DATE
    */

    const dateText =
        getDateText();


    if (dateText) {

        ctx.font =
            "22px Arial";


        ctx.fillText(

            dateText,

            WIDTH / 2,

            HEIGHT - 58

        );

    }


    /*
        DECORATION
    */

    ctx.font =
        "45px Arial";


    ctx.fillStyle =
        textColor;


    ctx.fillText(
        "♥",
        55,
        78
    );


    ctx.fillText(
        "♥",
        WIDTH - 55,
        HEIGHT - 48
    );


    /*
        POLAROID BORDER
    */

    if (
        frame === "polaroid"
    ) {

        ctx.strokeStyle =
            "#dddddd";


        ctx.lineWidth =
            5;


        ctx.strokeRect(
            22,
            22,
            WIDTH - 44,
            HEIGHT - 44
        );

    }


    /*
        NEWSPAPER BORDER
    */

    if (
        frame === "newspaper"
    ) {

        ctx.strokeStyle =
            "#555";


        ctx.lineWidth =
            4;


        ctx.strokeRect(
            35,
            35,
            WIDTH - 70,
            HEIGHT - 70
        );


        ctx.font =
            "700 22px Georgia";


        ctx.fillText(
            "LOVEBOX • MEMORY EDITION",
            WIDTH / 2,
            195
        );

    }


    /*
        RAINBOW / SUNSET / CHECKER BORDER
    */

    if (
        [
            "rainbow",
            "sunset",
            "checker"
        ].includes(frame)
    ) {

        ctx.strokeStyle =
            "#ffffffcc";


        ctx.lineWidth =
            12;


        ctx.strokeRect(
            22,
            22,
            WIDTH - 44,
            HEIGHT - 44
        );

    }


    /*
        FILM PERFORATIONS
    */

    if (
        frame === "film"
    ) {

        ctx.fillStyle =
            "#000";


        for (
            let x = 30;
            x < WIDTH - 20;
            x += 55
        ) {

            ctx.fillRect(
                x,
                10,
                32,
                24
            );


            ctx.fillRect(
                x,
                HEIGHT - 34,
                32,
                24
            );

        }

    }


    /*
        Convert Canvas → JPG Blob.
    */

    return new Promise(
        (
            resolve,
            reject
        ) => {

            canvas.toBlob(

                blob => {

                    if (!blob) {

                        reject(
                            new Error(
                                "JPG gagal dibuat."
                            )
                        );

                        return;

                    }


                    resolve(
                        blob
                    );

                },

                "image/jpeg",

                0.95

            );

        }
    );

}


/* =====================================================
   PREPARE FINAL IMAGE
===================================================== */

async function prepareImage() {

    if (
        !photos.length
    ) {

        alert(
            "Belum ada foto."
        );

        return false;

    }


    try {

        setSaveStatus(
            "⏳ Membuat JPG..."
        );


        finalBlob =
            await createFinalImage();


        if (
            finalURL
        ) {

            URL.revokeObjectURL(
                finalURL
            );

        }


        finalURL =
            URL.createObjectURL(
                finalBlob
            );


        setSaveStatus(
            "✅ JPG siap disimpan."
        );


        return true;


    } catch (error) {

        console.error(error);


        setSaveStatus(
            "❌ Gagal membuat JPG."
        );


        return false;

    }

}


/* =====================================================
   FILE NAME
===================================================== */

function getFilename() {

    const name1 =
        clean(
            document.getElementById(
                "name1"
            ).value
        )
        .replace(
            /[^a-zA-Z0-9_-]/g,
            ""
        );


    const name2 =
        clean(
            document.getElementById(
                "name2"
            ).value
        )
        .replace(
            /[^a-zA-Z0-9_-]/g,
            ""
        );


    if (
        name1 &&
        name2
    ) {

        return (
            `LoveBox-${name1}-${name2}.jpg`
        );

    }


    return (
        "LoveBox-Photobooth.jpg"
    );

}


/* =====================================================
   DOWNLOAD
===================================================== */

document
    .getElementById(
        "downloadButton"
    )
    .addEventListener(
        "click",
        async () => {

            const ready =
                await prepareImage();


            if (!ready)
                return;


            /*
                Download Blob directly.
            */

            const url =
                URL.createObjectURL(
                    finalBlob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                getFilename();


            link.style.display =
                "none";


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            setTimeout(
                () => {

                    URL.revokeObjectURL(
                        url
                    );

                },
                10000
            );


            setSaveStatus(

                "💾 Download dimulai. Jika tidak terlihat, cek folder Download."

            );

        }
    );


/* =====================================================
   OPEN IMAGE
===================================================== */

document
    .getElementById(
        "openButton"
    )
    .addEventListener(
        "click",
        async () => {

            const ready =
                await prepareImage();


            if (!ready)
                return;


            /*
                Important fallback for Android.
            */

            const newWindow =
                window.open(
                    finalURL,
                    "_blank"
                );


            /*
                If popup is blocked,
                navigate current page.
            */

            if (
                !newWindow
            ) {

                window.location.href =
                    finalURL;

            }


            setSaveStatus(

                "🖼️ Gambar dibuka. Tekan lama gambar lalu pilih Simpan/Download."

            );

        }
    );


/* =====================================================
   SHARE
===================================================== */

document
    .getElementById(
        "shareButton"
    )
    .addEventListener(
        "click",
        async () => {

            const ready =
                await prepareImage();


            if (!ready)
                return;


            if (
                !navigator.share
            ) {

                alert(
                    "Browser ini belum mendukung Share. Gunakan Buka Gambar."
                );


                return;

            }


            const file =
                new File(

                    [
                        finalBlob
                    ],

                    getFilename(),

                    {
                        type:
                            "image/jpeg"
                    }

                );


            try {

                if (
                    navigator.canShare &&
                    !navigator.canShare({
                        files: [file]
                    })
                ) {

                    throw new Error(
                        "File sharing tidak tersedia."
                    );

                }


                await navigator.share({

                    title:
                        "LoveBox 💗",

                    text:
                        "Our little memory ♡",

                    files: [
                        file
                    ]

                });


                setSaveStatus(
                    "📤 Foto berhasil dibagikan."
                );


            } catch (error) {

                if (
                    error.name ===
                    "AbortError"
                ) {

                    return;

                }


                alert(
                    "Share foto tidak didukung browser ini. Gunakan Buka Gambar."
                );

            }

        }
    );


/* =====================================================
   RETAKE
===================================================== */

document
    .getElementById(
        "retakeButton"
    )
    .addEventListener(
        "click",
        () => {

            photos = [];


            finalBlob = null;


            if (
                finalURL
            ) {

                URL.revokeObjectURL(
                    finalURL
                );


                finalURL =
                    null;

            }


            result.style.display =
                "none";


            setSaveStatus(
                ""
            );


            setStatus(
                "📸 Siap mengambil foto lagi!"
            );


            window.scrollTo({

                top: 0,

                behavior:
                    "smooth"

            });

        }
    );


/* =====================================================
   CLEANUP
===================================================== */

window.addEventListener(
    "beforeunload",
    () => {

        stopCamera();


        if (
            finalURL
        ) {

            URL.revokeObjectURL(
                finalURL
            );

        }

    }
);

})();
