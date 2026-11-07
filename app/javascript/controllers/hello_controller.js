import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["name", "output"]

  greet() {
    const name = this.nameTarget.value.trim() || "World"
    this.outputTarget.textContent = `Hello, ${name}!`
  }
}
