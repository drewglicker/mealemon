// Department/dietary-flag -> visual tone mapping from the Claude Design canvas.

export interface Tone {
  bg: string
  text: string
  dot: string
}

const PRODUCE: Tone = { bg: 'bg-[#e4ecdf]', text: 'text-[#3f5c44]', dot: '#e4ecdf' }
const MEAT: Tone = { bg: 'bg-[#f5e3e2]', text: 'text-[#7e4a4d]', dot: '#f5e3e2' }
const DAIRY: Tone = { bg: 'bg-[#e5ebf2]', text: 'text-[#3f5772]', dot: '#e5ebf2' }
const BAKING: Tone = { bg: 'bg-[#f3ecdc]', text: 'text-[#71592c]', dot: '#f3ecdc' }
const OTHER: Tone = { bg: 'bg-[#efece4]', text: 'text-[#5c584e]', dot: '#efece4' }

export function departmentTone(department: string): Tone {
  switch (department) {
    case 'Produce':
      return PRODUCE
    case 'Meat & Seafood':
      return MEAT
    case 'Dairy, Cheese & Eggs':
      return DAIRY
    case 'Bakery':
    case 'Baking & Spices':
      return BAKING
    default:
      return OTHER
  }
}

export function dietaryTagTone(flag: string): Tone {
  switch (flag) {
    case 'Vegetarian':
    case 'Gluten-Free':
      return PRODUCE
    case 'Dairy-Free':
      return DAIRY
    case 'Low Carb':
      return BAKING
    default:
      return OTHER
  }
}
