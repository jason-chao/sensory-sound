# Research

Background research behind the sound engine.

## Singing bowls

[Rebuilding sensory-sound's singing bowls from measured physics](reports/Singing%20bowl%20sound%20synthesis.md) brings together the acoustics literature, measurements of 20 freely licensed recordings, synthesis methods for the browser, and the evidence on calming effects and on safety for listeners with sound sensitivity.

The notes behind it are in [research_notes/Singing bowl sound synthesis](research_notes/Singing%20bowl%20sound%20synthesis/):

- `acoustics_literature.md`: modes, partial ratios, mode splitting, decay, striking and rubbing, water, size and material
- `recording_analysis.md`: measurements from the recordings, with sources and licences
- `synthesis_methods.md`: additive, modal and physical models, and what works in Web Audio
- `effects_and_safety.md`: the evidence on calm and "healing" effects, popular claims, hyperacusis and listening levels
- `analysis_validation.md`: the measurement scripts checked against synthetic bowls with known values, with the tolerances to use when comparing synthesis to the recordings
- `analysis/`: the scripts used for the measurements. They download the recordings to a local folder; no audio is kept in this repository.

The trimmed reference clips used on the listening page are not in the repository either; a private script produces them from the recordings listed in `recording_analysis.md`, and `site/clips.json` records which recording, start time and length each clip uses.
- [synthesis_as_built.md](research_notes/Singing%20bowl%20sound%20synthesis/synthesis_as_built.md): what the bowl layers in 0.2.0 do, and their output measured with the same methods as the recordings.
