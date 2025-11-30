# Claude Code Instructions

This project is a CLI tool for recording demo videos and screenshots of web apps.

## Example Prompts

### Creating Demos

- "Create a demo for my app at localhost:3000 that shows the login flow"
- "Make a demo file that clicks through the signup process"

### Recording Videos

- "Record a video of the example demo"
- "Run the bleep wordlist demo and record it"
- "Record demos/my-feature.demo.ts with headed mode"

### Capturing Screenshots

- "Take screenshots of the hackernews demo"
- "Capture screenshots from the bleep wordlist demo"
- "Create a screenshot walkthrough of the signup flow"
- "Generate screenshots for documentation from demos/example.demo.ts"

### Both Outputs

- "Record a video and capture screenshots of the login demo"
- "I need both a video and screenshots of this feature demo"

## Commands Reference

```bash
# Video recording
demo-recorder record <demo-file> [--headed] [--no-convert]

# Screenshot capture
demo-recorder screenshot <demo-file> [--format png|jpeg|webp] [--headed] [--no-gallery]

# Create new demo
demo-recorder create <id> --url <url>

# List demos
demo-recorder list
```

## Output Locations

- Videos: `output/<demo-id>/<filename>.mp4`
- Screenshots: `output/<demo-id>/screenshot-*.png`
- Gallery: `output/<demo-id>/gallery.html`
