import {
  Canvas,
  useFrame,
  useThree,
  useLoader
} from "@react-three/fiber"

import {
  Text,
  RoundedBox
} from "@react-three/drei"

import { useRef, useState } from "react"
import * as THREE from "three"

import placeholderImage from "./assets/images/placeholder.jpg"
import placeholderBg from "./assets/images/placeholderbg.jpeg"

import "./App.css"

const ROPE_LENGTH = 2.2
const LANYARD_OFFSET_Y = 2.2

// =====================================
// DEFAULT LAYOUT
// =====================================

const defaultLayout = {
  body: {
    width: 1.7,
    height: 2.35,
    radius: 0.12
  },

  header: {
    x: 0,
    y: 0.745,
    width: 1.5,
    height: 0.3,
    size: 0.16,
    radius: 0.05
  },

  photo: {
    x: 0,
    y: 0.07,
    width: 0.85,
    height: 1.05,
    radius: 0.08
  },

  name: {
    x: 0,
    y: -0.55,
    width: 1.5,
    height: 0.2,
    size: 0.1,
    radius: 0.05
  },

  role: {
    x: 0,
    y: -0.73,
    width: 1.5,
    height: 0.2,
    size: 0.08,
    radius: 0.05
  },

  id: {
    x: 0,
    y: -0.88,
    width: 1.5,
    height: 0.2,
    size: 0.065,
    radius: 0.05
  }
}


// =====================================
// LANYARD
// =====================================

function Lanyard({
  idCard,
  layout
}) {

  const cardRef = useRef()

  const position = useRef(
    new THREE.Vector2(0, -1.7)
  )

  const velocity = useRef(
    new THREE.Vector2(0, 0)
  )

  const dragPosition = useRef(
    new THREE.Vector2()
  )

  const previousDragPosition = useRef(
    new THREE.Vector2()
  )

  const dragging = useRef(false)

  const { viewport } = useThree()


  // ===================================
  // MOUSE → WORLD
  // ===================================

  const getMousePosition = (pointer) => {

    return new THREE.Vector2(
      pointer.x * viewport.width / 2,
      pointer.y * viewport.height / 2 -
        LANYARD_OFFSET_Y
    )
  }


  // ===================================
  // POINTER DOWN
  // ===================================

  const handlePointerDown = (event) => {

    event.stopPropagation()

    event.target.setPointerCapture(
      event.pointerId
    )

    dragging.current = true

    velocity.current.set(0, 0)

    const mouse =
      getMousePosition(event.pointer)

    dragPosition.current.copy(mouse)

    previousDragPosition.current.copy(mouse)

    document.body.style.cursor =
      "grabbing"
  }


  // ===================================
  // POINTER MOVE
  // ===================================

  const handlePointerMove = (event) => {

    if (!dragging.current)
      return

    event.stopPropagation()

    const mouse =
      getMousePosition(event.pointer)

    dragPosition.current.copy(mouse)

    velocity.current
      .subVectors(
        mouse,
        previousDragPosition.current
      )
      .multiplyScalar(5)

    previousDragPosition.current.copy(mouse)
  }


  // ===================================
  // POINTER UP
  // ===================================

  const handlePointerUp = (event) => {

    event.stopPropagation()

    if (!dragging.current)
      return

    event.target.releasePointerCapture(
      event.pointerId
    )

    dragging.current = false

    document.body.style.cursor =
      "default"
  }


  // ===================================
  // PHYSICS
  // ===================================

  useFrame((_, delta) => {

    const dt =
      Math.min(delta, 0.033)

    const p =
      position.current

    const v =
      velocity.current


    // =================================
    // DRAGGING
    // =================================

    if (dragging.current) {

      p.lerp(
        dragPosition.current,
        0.85
      )
    }


    // =================================
    // RELEASED
    // =================================

    else {

      v.y -=
        9.8 * dt

      const targetX = 0
      const targetY = -1.7

      const forceX =
        (targetX - p.x) * 18

      const forceY =
        (targetY - p.y) * 18

      v.x +=
        forceX * dt

      v.y +=
        forceY * dt


      // ===============================
      // ROPE SPRING
      // ===============================

      const distance =
        p.length()

      if (
        distance >
        ROPE_LENGTH
      ) {

        const stretch =
          distance - ROPE_LENGTH

        const nx =
          p.x / distance

        const ny =
          p.y / distance

        const ropeForce =
          stretch * 25

        v.x -=
          nx * ropeForce * dt

        v.y -=
          ny * ropeForce * dt
      }


      // ===============================
      // DAMPING
      // ===============================

      v.multiplyScalar(
        Math.pow(
          0.97,
          dt * 60
        )
      )


      // ===============================
      // APPLY
      // ===============================

      p.x +=
        v.x * dt

      p.y +=
        v.y * dt
    }


    // =================================
    // CARD VISUAL
    // =================================

    if (cardRef.current) {

      cardRef.current.position.set(
        p.x,
        p.y + LANYARD_OFFSET_Y,
        0
      )

      const targetRotation =
        -v.x * 0.035

      cardRef.current.rotation.z =
        THREE.MathUtils.lerp(
          cardRef.current.rotation.z,
          targetRotation,
          0.15
        )
    }

  })


  return (
    <>

      <Rope
        position={position}
      />

      <Connector
        position={position}
      />

      <group
        ref={cardRef}

        onPointerDown={
          handlePointerDown
        }

        onPointerMove={
          handlePointerMove
        }

        onPointerUp={
          handlePointerUp
        }

        onPointerCancel={
          handlePointerUp
        }
      >

        <Card
          idCard={idCard}
          layout={layout}
        />

      </group>

    </>
  )
}


// =====================================
// ROPE
// =====================================

function Rope({ position }) {

  const ropeRef =
    useRef()

  useFrame(() => {

    if (!ropeRef.current)
      return

    const end =
      position.current

    const start =
      new THREE.Vector3(
        0,
        0,
        0
      )

    const ropeEnd =
      new THREE.Vector3(
        end.x,
        end.y + 1.175,
        0
      )

    const middle =
      new THREE.Vector3(
        end.x * 0.45,
        (end.y + 1.175) * 0.45,
        0
      )

    const curve =
      new THREE.CatmullRomCurve3([
        start,
        middle,
        ropeEnd
      ])

    const segments = 40
    const width = 0.24

    const vertices = []
    const indices = []

    for (
      let i = 0;
      i <= segments;
      i++
    ) {

      const t =
        i / segments

      const point =
        curve.getPointAt(t)

      const tangent =
        curve
          .getTangentAt(t)
          .normalize()

      const normal =
        new THREE.Vector3(
          -tangent.y,
          tangent.x,
          0
        ).normalize()

      const left =
        point.clone().add(
          normal
            .clone()
            .multiplyScalar(
              width / 2
            )
        )

      const right =
        point.clone().sub(
          normal
            .clone()
            .multiplyScalar(
              width / 2
            )
        )

      vertices.push(
        left.x,
        left.y,
        left.z,

        right.x,
        right.y,
        right.z
      )
    }

    for (
      let i = 0;
      i < segments;
      i++
    ) {

      const a = i * 2
      const b = a + 1
      const c = a + 2
      const d = a + 3

      indices.push(
        a, b, c,
        b, d, c
      )
    }

    const geometry =
      new THREE.BufferGeometry()

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        vertices,
        3
      )
    )

    geometry.setIndex(indices)

    geometry.computeVertexNormals()

    ropeRef.current.geometry.dispose()

    ropeRef.current.geometry =
      geometry
  })


  return (
    <group
      position={[
        0,
        LANYARD_OFFSET_Y,
        0
      ]}
    >

      <mesh ref={ropeRef}>

        <meshStandardMaterial
          color="#111"
          side={THREE.DoubleSide}
          roughness={0.5}
        />

      </mesh>

    </group>
  )
}


// =====================================
// CONNECTOR
// =====================================

function Connector({ position }) {

  const ref =
    useRef()

  useFrame(() => {

    if (!ref.current)
      return

    const p =
      position.current

    ref.current.position.set(
      p.x,
      p.y +
        1.175 +
        LANYARD_OFFSET_Y,
      0
    )
  })


  return (
    <group ref={ref}>

      <mesh
        rotation={[
          Math.PI / 2,
          0,
          0
        ]}
      >

        <torusGeometry
          args={[
            0.14,
            0.035,
            12,
            24
          ]}
        />

        <meshStandardMaterial
          color="#777"
          metalness={0.9}
          roughness={0.25}
        />

      </mesh>

    </group>
  )
}


// =====================================
// ROUNDED CARD 3D
// =====================================

function RoundedCard3D({
  width,
  height,
  radius = 0.12,
  depth = 0.12,
  photo
}) {

  const texture =
    useLoader(
      THREE.TextureLoader,
      photo
    )


  // ===================================
  // IMAGE COVER
  // ===================================

  const imageRatio =
    texture.image.width /
    texture.image.height

  const containerRatio =
    width / height


  texture.wrapS =
    THREE.ClampToEdgeWrapping

  texture.wrapT =
    THREE.ClampToEdgeWrapping


  if (
    imageRatio >
    containerRatio
  ) {

    texture.repeat.set(
      containerRatio /
        imageRatio,
      1
    )

    texture.offset.set(
      (
        1 -
        texture.repeat.x
      ) / 2,
      0
    )

  } else {

    texture.repeat.set(
      1,
      imageRatio /
        containerRatio
    )

    texture.offset.set(
      0,
      (
        1 -
        texture.repeat.y
      ) / 2
    )
  }


  texture.colorSpace =
    THREE.SRGBColorSpace

  texture.needsUpdate = true


  // ===================================
  // ROUNDED SHAPE
  // ===================================

  const shape =
    new THREE.Shape()

  const x =
    -width / 2

  const y =
    -height / 2

  const r =
    Math.min(
      radius,
      width / 2,
      height / 2
    )


  shape.moveTo(
    x + r,
    y
  )

  shape.lineTo(
    x + width - r,
    y
  )

  shape.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + r
  )

  shape.lineTo(
    x + width,
    y + height - r
  )

  shape.quadraticCurveTo(
    x + width,
    y + height,
    x + width - r,
    y + height
  )

  shape.lineTo(
    x + r,
    y + height
  )

  shape.quadraticCurveTo(
    x,
    y + height,
    x,
    y + height - r
  )

  shape.lineTo(
    x,
    y + r
  )

  shape.quadraticCurveTo(
    x,
    y,
    x + r,
    y
  )


  // ===================================
  // FRONT GEOMETRY
  // ===================================

  const geometry =
    new THREE.ShapeGeometry(
      shape
    )


  // ===================================
  // UV
  // ===================================

  const uv =
    geometry.attributes.uv

  for (
    let i = 0;
    i < uv.count;
    i++
  ) {

    const vx =
      geometry
        .attributes
        .position
        .getX(i)

    const vy =
      geometry
        .attributes
        .position
        .getY(i)

    uv.setXY(
      i,
      (
        vx +
        width / 2
      ) / width,
      (
        vy +
        height / 2
      ) / height
    )
  }

  uv.needsUpdate = true


  return (
    <group>

      {/* ===============================
          3D CARD BODY
      =============================== */}

      <RoundedBox
        args={[
          width,
          height,
          depth
        ]}
        radius={radius}
        smoothness={8}
      >

        <meshStandardMaterial
          color="#ffffff"
          roughness={0.35}
          metalness={0}
        />

      </RoundedBox>


      {/* ===============================
          ROUNDED BACKGROUND
      =============================== */}

      <mesh
        geometry={geometry}
        position={[
          0,
          0,
          depth / 2 + 0.003
        ]}
      >

        <meshBasicMaterial
          map={texture}
          toneMapped={false}
        />

      </mesh>

    </group>
  )
}


// =====================================
// ROUNDED IMAGE
// =====================================

function RoundedImage({
  photo,
  width,
  height,
  radius = 0.08,
  position = [0, 0, 0]
}) {

  const texture =
    useLoader(
      THREE.TextureLoader,
      photo
    )

  const shape =
    new THREE.Shape()

  const x =
    -width / 2

  const y =
    -height / 2

  const r =
    Math.min(
      radius,
      width / 2,
      height / 2
    )


  shape.moveTo(
    x + r,
    y
  )

  shape.lineTo(
    x + width - r,
    y
  )

  shape.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + r
  )

  shape.lineTo(
    x + width,
    y + height - r
  )

  shape.quadraticCurveTo(
    x + width,
    y + height,
    x + width - r,
    y + height
  )

  shape.lineTo(
    x + r,
    y + height
  )

  shape.quadraticCurveTo(
    x,
    y + height,
    x,
    y + height - r
  )

  shape.lineTo(
    x,
    y + r
  )

  shape.quadraticCurveTo(
    x,
    y,
    x + r,
    y
  )


  const geometry =
    new THREE.ShapeGeometry(
      shape
    )


  // ===================================
  // UV
  // ===================================

  const uv =
    geometry.attributes.uv

  for (
    let i = 0;
    i < uv.count;
    i++
  ) {

    const vx =
      geometry
        .attributes
        .position
        .getX(i)

    const vy =
      geometry
        .attributes
        .position
        .getY(i)

    uv.setXY(
      i,
      (
        vx +
        width / 2
      ) / width,
      (
        vy +
        height / 2
      ) / height
    )
  }

  uv.needsUpdate = true

  texture.colorSpace =
    THREE.SRGBColorSpace

  texture.needsUpdate = true


  return (
    <mesh
      geometry={geometry}
      position={position}
    >

      <meshBasicMaterial
        map={texture}
        toneMapped={false}
      />

    </mesh>
  )
}

// =====================================
// ROUNDED BG
// =====================================

function RoundedPanel({
  width,
  height,
  radius = 0.05,
  position = [0, 0, 0],
  color = "#202020"
}) {

  const shape = new THREE.Shape()

  const x = -width / 2
  const y = -height / 2

  const r = Math.min(
    radius,
    width / 2,
    height / 2
  )

  shape.moveTo(
    x + r,
    y
  )

  shape.lineTo(
    x + width - r,
    y
  )

  shape.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + r
  )

  shape.lineTo(
    x + width,
    y + height - r
  )

  shape.quadraticCurveTo(
    x + width,
    y + height,
    x + width - r,
    y + height
  )

  shape.lineTo(
    x + r,
    y + height
  )

  shape.quadraticCurveTo(
    x,
    y + height,
    x,
    y + height - r
  )

  shape.lineTo(
    x,
    y + r
  )

  shape.quadraticCurveTo(
    x,
    y,
    x + r,
    y
  )

  const geometry =
    new THREE.ShapeGeometry(shape)

  return (
    <mesh
      geometry={geometry}
      position={position}
    >
      <meshBasicMaterial
        color={color}
      />
    </mesh>
  )
}

// =====================================
// CARD
// =====================================

function Card({
  idCard,
  layout
}) {

  return (
    <>

      {/* =================================
          BODY
      ================================= */}

      <RoundedCard3D
        photo={
          idCard.bg ||
          placeholderBg
        }
        width={layout.body.width}
        height={layout.body.height}
        radius={0.05}
        depth={0.12}
      />

      {/* =================================
          HEADER
      ================================= */}

      <RoundedPanel
        width={layout.header.width}
        height={layout.header.height}
        radius={layout.header.radius}
        position={[
          layout.header.x,
          layout.header.y,
          0.07
        ]}
      />


      {/* HEADER TEXT */}

      <Text
        position={[
          layout.header.x,
          layout.header.y,
          0.11
        ]}
        fontSize={
          layout.header.size
        }
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {idCard.title}
      </Text>


      {/* =================================
          PHOTO
      ================================= */}

      <RoundedImage
        photo={
          idCard.photo ||
          placeholderImage
        }
        width={
          layout.photo.width
        }
        height={
          layout.photo.height
        }
        radius={
          layout.photo.radius
        }
        position={[
          layout.photo.x,
          layout.photo.y,
          0.08
        ]}
      />


      {/* =================================
          NAME BG
      ================================= */}

      <RoundedPanel
        width={layout.name.width}
        height={layout.name.height}
        radius={layout.name.radius}
        position={[
          layout.name.x,
          layout.name.y,
          0.07
        ]}
      />


      {/* NAME */}

      <Text
        position={[
          layout.name.x,
          layout.name.y,
          0.11
        ]}
        fontSize={
          layout.name.size
        }
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {idCard.name}
      </Text>


      {/* =================================
          ROLE BG
      ================================= */}

      <RoundedPanel
        width={layout.role.width}
        height={layout.role.height}
        radius={layout.role.radius}
        position={[
          layout.role.x,
          layout.role.y,
          0.07
        ]}
      />


      {/* ROLE */}

      <Text
        position={[
          layout.role.x,
          layout.role.y,
          0.11
        ]}
        fontSize={
          layout.role.size
        }
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {idCard.role}
      </Text>


      {/* =================================
          ID BG
      ================================= */}

      <RoundedPanel
        width={layout.id.width}
        height={layout.id.height}
        radius={layout.id.radius}
        position={[
          layout.id.x,
          layout.id.y,
          0.07
        ]}
      />


      {/* ID */}

      <Text
        position={[
          layout.id.x,
          layout.id.y,
          0.11
        ]}
        fontSize={
          layout.id.size
        }
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        ID: {idCard.id}
      </Text>

    </>
  )
}


// =====================================
// NAVBAR
// =====================================

function Navbar() {

  return (
    <nav className="navbar">

      <div className="navbar-logo">
        HICARD
      </div>

      <div className="navbar-links">

        <button className="support-btn">
          Support us
          <svg height="22" width="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0H24V24H0z" fill="none"></path><path d="M16.5 3C19.538 3 22 5.5 22 9c0 7-7.5 11-10 12.5C9.5 20 2 16 2 9c0-3.5 2.5-6 5.5-6C9.36 3 11 4 12 5c1-1 2.64-2 4.5-2z"></path></svg>
        </button>

      </div>

    </nav>
  )
}


// =====================================
// DOWNLOAD BUTTON
// =====================================

function Download({
  editMode,
  setEditMode,
  downloadIdCard
}) {

  return (
    <div className="navigation-btn">

      <button
        className="edit-btn"
        onClick={() =>
          setEditMode(
            !editMode
          )
        }
      >
        {
          editMode
            ? "CLOSE"
            : "EDIT"
        }
      </button>

      <button className="download-btn" type="button"
        onClick={
            downloadIdCard
          }>
        <span className="download__text">Download</span>
        <span className="download__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 35" id="bdd05811-e15d-428c-bb53-8661459f9307" data-name="Layer 2" class="svg"><path d="M17.5,22.131a1.249,1.249,0,0,1-1.25-1.25V2.187a1.25,1.25,0,0,1,2.5,0V20.881A1.25,1.25,0,0,1,17.5,22.131Z"></path><path d="M17.5,22.693a3.189,3.189,0,0,1-2.262-.936L8.487,15.006a1.249,1.249,0,0,1,1.767-1.767l6.751,6.751a.7.7,0,0,0,.99,0l6.751-6.751a1.25,1.25,0,0,1,1.768,1.767l-6.752,6.751A3.191,3.191,0,0,1,17.5,22.693Z"></path><path d="M31.436,34.063H3.564A3.318,3.318,0,0,1,.25,30.749V22.011a1.25,1.25,0,0,1,2.5,0v8.738a.815.815,0,0,0,.814.814H31.436a.815.815,0,0,0,.814-.814V22.011a1.25,1.25,0,1,1,2.5,0v8.738A3.318,3.318,0,0,1,31.436,34.063Z"></path></svg></span>
      </button>

    </div>
  )
}


// =====================================
// DRAW IMAGE COVER
// =====================================

function drawImageCover(
  ctx,
  image,
  x,
  y,
  width,
  height
) {

  const imageRatio =
    image.width /
    image.height

  const containerRatio =
    width / height

  let sourceX = 0
  let sourceY = 0

  let sourceWidth =
    image.width

  let sourceHeight =
    image.height


  if (
    imageRatio >
    containerRatio
  ) {

    sourceWidth =
      image.height *
      containerRatio

    sourceX =
      (
        image.width -
        sourceWidth
      ) / 2

  } else {

    sourceHeight =
      image.width /
      containerRatio

    sourceY =
      (
        image.height -
        sourceHeight
      ) / 2
  }


  ctx.drawImage(
    image,

    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,

    x,
    y,
    width,
    height
  )
}


// =====================================
// EDIT PANEL
// =====================================

function EditPanel({
  idCard,
  setIdCard
}) {

  const handleChange =
    (event) => {

      const {
        name,
        value
      } = event.target

      setIdCard(
        (prev) => ({
          ...prev,
          [name]: value
        })
      )
    }


  const handleBg =
    (event) => {

      const file =
        event.target.files[0]

      if (!file)
        return

      const imageURL =
        URL.createObjectURL(
          file
        )

      setIdCard(
        (prev) => ({
          ...prev,
          bg: imageURL
        })
      )
    }


  const handlePhoto =
    (event) => {

      const file =
        event.target.files[0]

      if (!file)
        return

      const imageURL =
        URL.createObjectURL(
          file
        )

      setIdCard(
        (prev) => ({
          ...prev,
          photo: imageURL
        })
      )
    }


  return (
    <div className="edit-panel">

      <h2>
        Edit ID Card
      </h2>


      <label>
        Background
      </label>

      <input
        type="file"
        name="bg"
        onChange={
          handleBg
        }
      />


      <label>
        Title
      </label>

      <input
        type="text"
        name="title"
        value={
          idCard.title
        }
        onChange={
          handleChange
        }
      />


      <label>
        Nama
      </label>

      <input
        type="text"
        name="name"
        value={
          idCard.name
        }
        onChange={
          handleChange
        }
      />


      <label>
        Jabatan
      </label>

      <input
        type="text"
        name="role"
        value={
          idCard.role
        }
        onChange={
          handleChange
        }
      />


      <label>
        ID
      </label>

      <input
        type="text"
        name="id"
        value={
          idCard.id
        }
        onChange={
          handleChange
        }
      />


      <label>
        Foto
      </label>

      <input
        type="file"
        accept="image/*"
        onChange={
          handlePhoto
        }
      />

    </div>
  )
}


// =====================================
// APP
// =====================================

function App() {

  const [
    idCard,
    setIdCard
  ] = useState({

    bg: null,

    title:
      "ID CARD",

    name:
      "Budi Tarmizi",

    role:
      "Tempik Hunter",

    id:
      "00067",

    photo:
      null
  })


  const [
    editMode,
    setEditMode
  ] = useState(false)


  const [
    layout,
    setLayout
  ] = useState(
    defaultLayout
  )


  // ===================================
  // DOWNLOAD
  // ===================================

  const downloadIdCard =
    async () => {

      const canvas =
        document.createElement(
          "canvas"
        )

      const ctx =
        canvas.getContext("2d")


      const scale = 3

      const width = 600
      const height = 830

      canvas.width =
        width * scale

      canvas.height =
        height * scale

      ctx.scale(
        scale,
        scale
      )


      // =================================
      // SCALE
      // =================================

      const cardWidth =
        1.7

      const cardHeight =
        2.35

      const scaleX =
        width /
        cardWidth

      const scaleY =
        height /
        cardHeight


      // =================================
      // BODY
      // =================================

      ctx.save()

      ctx.beginPath()

      ctx.roundRect(
        0,
        0,
        width,
        height,
        35
      )

      ctx.clip()


      const bgImage =
        new Image()

      bgImage.src =
        idCard.bg ||
        placeholderBg


      await new Promise(
        (
          resolve,
          reject
        ) => {

          bgImage.onload =
            resolve

          bgImage.onerror =
            reject

        }
      )


      drawImageCover(
        ctx,
        bgImage,
        0,
        0,
        width,
        height
      )

      ctx.restore()


      // =================================
      // HEADER
      // =================================

      const headerX =
        width / 2 +
        layout.header.x *
          scaleX

      const headerY =
        height / 2 -
        layout.header.y *
          scaleY

      const headerWidth =
        layout.header.width *
        scaleX

      const headerHeight =
        layout.header.height *
        scaleY


      ctx.fillStyle =
        "#202020"

      ctx.beginPath()

      ctx.roundRect(
        headerX -
          headerWidth / 2,
        headerY -
          headerHeight / 2,
        headerWidth,
        headerHeight,
        20
      )

      ctx.fill()


      // =================================
      // HEADER TEXT
      // =================================

      ctx.fillStyle =
        "#ffffff"

      ctx.font =
        `bold ${
          layout.header.size *
          scaleX
        }px Arial`

      ctx.textAlign =
        "center"

      ctx.textBaseline =
        "middle"

      ctx.fillText(
        idCard.title,
        headerX,
        headerY
      )


      // =================================
      // PHOTO
      // =================================

      const photoX =
        width / 2 +
        layout.photo.x *
          scaleX

      const photoY =
        height / 2 -
        layout.photo.y *
          scaleY

      const photoWidth =
        layout.photo.width *
        scaleX

      const photoHeight =
        layout.photo.height *
        scaleY


      const photoImage =
        new Image()

      photoImage.src =
        idCard.photo ||
        placeholderImage


      await new Promise(
        (
          resolve,
          reject
        ) => {

          photoImage.onload =
            resolve

          photoImage.onerror =
            reject

        }
      )


      ctx.save()

      ctx.beginPath()

      ctx.roundRect(
        photoX -
          photoWidth / 2,
        photoY -
          photoHeight / 2,
        photoWidth,
        photoHeight,
        20
      )

      ctx.clip()


      drawImageCover(
        ctx,
        photoImage,
        photoX -
          photoWidth / 2,
        photoY -
          photoHeight / 2,
        photoWidth,
        photoHeight
      )

      ctx.restore()


      // =================================
      // NAME BG
      // =================================

      const nameX =
        width / 2 +
        layout.name.x *
          scaleX

      const nameY =
        height / 2 -
        layout.name.y *
          scaleY

      const nameWidth =
        layout.name.width *
        scaleX

      const nameHeight =
        layout.name.height *
        scaleY


      ctx.fillStyle =
        "#202020"

      ctx.beginPath()

      ctx.roundRect(
        nameX -
          nameWidth / 2,
        nameY -
          nameHeight / 2,
        nameWidth,
        nameHeight,
        20
      )

      ctx.fill()


      // =================================
      // NAME TEXT
      // =================================

      ctx.fillStyle =
        "#ffffff"

      ctx.font =
        `bold ${
          layout.name.size *
          scaleX
        }px Arial`

      ctx.textAlign =
        "center"

      ctx.textBaseline =
        "middle"

      ctx.fillText(
        idCard.name,
        nameX,
        nameY
      )


      // =================================
      // ROLE BG
      // =================================

      const roleX =
        width / 2 +
        layout.role.x *
          scaleX

      const roleY =
        height / 2 -
        layout.role.y *
          scaleY

      const roleWidth =
        layout.role.width *
        scaleX

      const roleHeight =
        layout.role.height *
        scaleY


      ctx.fillStyle =
        "#202020"

      ctx.beginPath()

      ctx.roundRect(
        roleX -
          roleWidth / 2,
        roleY -
          roleHeight / 2,
        roleWidth,
        roleHeight,
        20
      )

      ctx.fill()


      // =================================
      // ROLE TEXT
      // =================================

      ctx.fillStyle =
        "#ffffff"

      ctx.font =
        `${
          layout.role.size *
          scaleX
        }px Arial`

      ctx.textAlign =
        "center"

      ctx.textBaseline =
        "middle"

      ctx.fillText(
        idCard.role,
        roleX,
        roleY
      )


      // =================================
      // ID BG
      // =================================

      const idX =
        width / 2 +
        layout.id.x *
          scaleX

      const idY =
        height / 2 -
        layout.id.y *
          scaleY

      const idWidth =
        layout.id.width *
        scaleX

      const idHeight =
        layout.id.height *
        scaleY


      ctx.fillStyle =
        "#202020"

      ctx.beginPath()

      ctx.roundRect(
        idX -
          idWidth / 2,
        idY -
          idHeight / 2,
        idWidth,
        idHeight,
        20
      )

      ctx.fill()


      // =================================
      // ID TEXT
      // =================================

      ctx.fillStyle =
        "#ffffff"

      ctx.font =
        `${
          layout.id.size *
          scaleX
        }px Arial`

      ctx.textAlign =
        "center"

      ctx.textBaseline =
        "middle"

      ctx.fillText(
        `ID: ${idCard.id}`,
        idX,
        idY
      )


      // =================================
      // DOWNLOAD
      // =================================

      const link =
        document.createElement(
          "a"
        )

      link.download =
        "id-card.png"

      link.href =
        canvas.toDataURL(
          "image/png"
        )

      link.click()
    }


  return (
    <div className="app">

      <Navbar />


      <main className="hero">

        <div className="id-frame">

          <Canvas
            camera={{
              position: [
                0,
                -1.2,
                7
              ],
              fov: 30
            }}
          >

            <ambientLight
              intensity={1}
            />

            <directionalLight
              position={[
                2,
                3,
                5
              ]}
              intensity={2}
            />


            <Lanyard
              idCard={idCard}
              layout={layout}
            />

          </Canvas>

        </div>

      </main>


      {/* EDIT PANEL */}

      {editMode && (

        <EditPanel
          idCard={idCard}
          setIdCard={
            setIdCard
          }
        />

      )}


      {/* BUTTONS */}

      <Download
        editMode={
          editMode
        }
        setEditMode={
          setEditMode
        }
        downloadIdCard={
          downloadIdCard
        }
      />

    </div>
  )
}


export default App