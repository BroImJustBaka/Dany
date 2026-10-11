import './Hero.css'
import { FloatingPetals } from '../components/FloatingPetals.jsx'

export function Hero() {
    return (
        <section className="hero" data-screen-label="01 Hero / Recepción">
            <FloatingPetals />

            <p className="hero-eyebrow">espero que te guste</p>
            <h1 className="hero-title">Feliz cumpleaños, Daniela</h1>
            <p className="hero-body">
                Hiii giirl, esta es mi contribución a tu regalo de cumpleaños, si no lloras te voy a dejar de hablar la neta hasta a mi me dio sentimiento andar haciendo este pedo
            </p>

            <div className="hero-actions">
                <a href="#manual" className="btn btn-solid">Empezar el recorrido</a>
                <a href="#manual" className="btn btn-outline">Ver el manual</a>
            </div>
        </section>
    )
}
