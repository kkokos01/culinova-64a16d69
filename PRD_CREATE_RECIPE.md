# Culinova Create Recipe PRD
**Document Version:** 1.0  
**Date:** November 21, 2025  
**Priority:** HIGH (MVP Completion)  

---

## 🎯 **EXECUTIVE SUMMARY**

This PRD defines the AI-powered recipe creation workflow that will complete Culinova's MVP. Leveraging our existing enterprise-grade infrastructure (18 recipe components, AI modification system, complete database schema), we will implement a 3-step creation flow that transforms vague user ideas into structured, cookable recipes.

**Key Differentiators:**
- Chat-free creation experience (vs. ChatGPT)
- Instant AI generation with structured constraints (vs. Allrecipes)
- Seamless modification integration (vs. Paprika)
- Personalized dietary support (vs. Mealime)

---

## 📊 **COMPONENT REUSE MAP**

### **Existing Infrastructure (70% Complete)**

| New Feature | Existing Component | Reuse Strategy |
|-------------|-------------------|----------------|
| **Recipe Preview Panel** | `RecipeContent.tsx` | 100% reuse - already displays recipes perfectly |
| **Ingredient Display** | `IngredientsSection.tsx` | 100% reuse - handles validation & normalization |
| **Step Display** | `StepsSection.tsx` | 100% reuse - already renders instructions |
| **AI Integration** | `AIModificationPanel.tsx` | 80% reuse - adapt for creation vs modification |
| **Recipe Metadata** | `RecipeHeader.tsx` | 100% reuse - displays time, difficulty, servings |
| **Version Management** | `RecipeVersionTabs.tsx` | 100% reuse - for created vs modified versions |
| **Database Operations** | `recipeService.ts` | 60% reuse - add create/update methods |
| **Form Validation** | Shadcn UI form components | 100% reuse - complete form system |
| **Toast Notifications** | Existing toast system | 100% reuse - user feedback |

### **Net-New Components Required (30% Gap)**

| Component | Purpose | Est. Complexity |
|-----------|---------|-----------------|
| `CreateRecipePanel.tsx` | Main 3-step creation interface | Medium |
| `ConceptInput.tsx` | Idea input with quick concepts | Low |
| `ConstraintSelector.tsx` | Dietary, time, skill toggles | Medium |
| `AIRecipeGenerator.tsx` | Structured AI prompting service | High |
| `RecipeCreateForm.tsx` | Basic manual creation fallback | Low |
| Database CRUD methods | createRecipe, updateRecipe, deleteRecipe | Medium |

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **Desktop Layout (3-Panel System)**
```
[LEFT PANEL]           [CENTER PANEL]              [RIGHT PANEL]
Collections/Spaces     Create Recipe Interface     Generated Recipe Preview
- Existing SpaceList   - ConceptInput              - RecipeContent (reused)
- Existing SpaceCards  - ConstraintSelector        - RecipeHeader (reused)
                        - AI controls               - Save/Modify buttons
```

### **Mobile Layout (Tabbed System)**
```
Tab 1: Create (ConceptInput + ConstraintSelector)
Tab 2: Preview (RecipeContent + actions)
Tab 3: Collections (existing space management)
```

### **Data Flow Architecture**
```
User Input → ConceptInput → ConstraintSelector → AIRecipeGenerator → 
recipeService.createRecipe() → RecipeContent (display) → Save/Modify actions
```

---

## 📱 **USER EXPERIENCE FLOW**

### **Step 1: Concept Input (Idea Capture)**
**Component:** `ConceptInput.tsx`

**UI Elements:**
- Large text input: "What do you want to make?"
- Placeholder examples:
  - "A high-protein breakfast smoothie"
  - "A light summer pasta using tomatoes and basil"
  - "A low-cost vegetarian dinner for 4"
- Quick Concept Buttons (8-12):
  - Quick Family Dinner
  - Healthy Meal Prep
  - Comfort Classic
  - Vegetarian Delight
  - High-Protein
  - Low Sodium
  - Keto
  - Global Flavors

**Behavior:**
- Clicking quick concept populates text field with structured prompt
- Real-time validation (minimum 3 characters)
- Focus management for smooth UX

### **Step 2: Constraint Selection (Optional Customization)**
**Component:** `ConstraintSelector.tsx`

**Collapsible Sections:**

**Dietary Toggles:**
- Vegan, Gluten-Free, Dairy-Free, Low Sodium, Keto, High-Protein

**Time Toggles:**
- Under 15 minutes, One-pot, 5-ingredient max

**Skill Toggles:**
- Beginner-friendly, Restaurant-quality, Minimal cleanup

**Ingredient Controls:**
- Exclude ingredients (autocomplete/tag UI)
- Spiciness level slider
- Allergen avoidance (common allergens)

### **Step 3: Generation & Preview**
**Component:** `AIRecipeGenerator.tsx` + existing `RecipeContent.tsx`

**Generation Process:**
1. Structured prompt assembly from user inputs
2. AI API call with constraints
3. Response validation and normalization
4. Display in right panel using existing components

**Generated Recipe Includes:**
- Title (AI-generated)
- Description (AI-generated)
- Image (AI or stock fallback)
- Ingredients with normalized units
- Steps with intuitive formatting
- Time, difficulty, serving count
- Dietary tags

**Action Buttons:**
- Regenerate (new variation)
- Refine This Recipe (opens existing AIModificationPanel)
- Save Recipe (creates version 1)
- Add to Meal Plan (future feature)

---

## 🤖 **AI INTEGRATION SPECIFICATION**

### **Structured Prompting System**
**Component:** `AIRecipeGenerator.tsx`

**Input Parameters:**
```typescript
interface AIRecipeRequest {
  concept: string;
  dietaryConstraints: string[];
  timeConstraints: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  excludedIngredients: string[];
  spicinessLevel: number;
  targetServings: number;
  cuisinePreference?: string;
}
```

**Output Schema:**
```typescript
interface AIRecipeResponse {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    notes?: string;
  }>;
  steps: string[];
  tags: string[];
  imageUrl?: string;
}
```

**Quality Assurance:**
- Constraint conflict detection
- Realistic ingredient combinations
- Logical step sequencing
- Proper scaling calculations
- Grammar and formatting cleanup

### **Error Handling & Edge Cases**
- Contradictory constraints → AI clarification dialog
- Vague prompts → Generate neutral recipe + ask for preferences
- Too many exclusions → Suggest relaxing constraints
- Missing tools → Include alternative methods

---

## 🔗 **INTEGRATION WITH EXISTING SYSTEMS**

### **Database Integration**
**File:** `src/services/supabase/recipeService.ts`

**New Methods Required:**
```typescript
async createRecipe(recipe: Partial<Recipe>): Promise<Recipe>
async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe>
async deleteRecipe(id: string): Promise<void>
```

**Integration Points:**
- Leverage existing `getRecipe()` for validation
- Use existing ingredient normalization
- Maintain RLS policies for space/user ownership
- Integrate with existing space context

### **Component Integration**
**Reuse Existing Components:**
- `RecipeContent.tsx` for generated recipe display
- `AIModificationPanel.tsx` for post-creation refinement
- `RecipeVersionTabs.tsx` for version management
- `IngredientsSection.tsx` for ingredient display
- All Shadcn UI form components

**New Component Hierarchy:**
```
CreateRecipePage.tsx
├── CreateRecipePanel.tsx
│   ├── ConceptInput.tsx
│   └── ConstraintSelector.tsx
├── RecipePreview.tsx (wraps existing RecipeContent)
└── RecipeActions.tsx (Save, Modify, Regenerate)
```

### **State Management Integration**
**Context Usage:**
- `AuthContext` for user authentication
- `SpaceContext` for current space selection
- New `RecipeCreateContext` for creation state

### **Routing Integration**
**New Routes Required:**
- `/recipes/create` - Main creation interface
- `/recipes/create/:templateId` - Create from template (future)

---

## 📋 **DEVELOPMENT PHASES**

### **Phase 1: Basic CRUD Foundation (Priority 1)**
**Timeline:** 2-3 days
**Goal:** Manual recipe creation without AI

**Deliverables:**
1. `recipeService` CRUD methods
2. Basic `RecipeCreateForm.tsx` component
3. `/recipes/create` route integration
4. Save functionality with existing `RecipeContent` display

**Acceptance Criteria:**
- Users can manually create recipes
- Recipes save to correct space/user
- All validation works
- Integration with existing components

### **Phase 2: AI-Powered Creation (Priority 2)**
**Timeline:** 3-4 days
**Goal:** Full AI creation workflow

**Deliverables:**
1. `ConceptInput.tsx` component
2. `ConstraintSelector.tsx` component
3. `AIRecipeGenerator.tsx` service
4. Integration with existing `AIModificationPanel`

**Acceptance Criteria:**
- 3-step creation flow works
- AI generates realistic recipes
- All constraints respected
- Quality assurance passes

### **Phase 3: Enhancement & Polish (Priority 3)**
**Timeline:** 2-3 days
**Goal:** Professional UX and edge cases

**Deliverables:**
1. Mobile responsive design
2. Error handling for edge cases
3. Loading states and animations
4. Accessibility improvements

**Acceptance Criteria:**
- Mobile experience matches desktop
- All edge cases handled gracefully
- Loading states provide good feedback
- WCAG accessibility compliance

---

## 🎯 **SUCCESS METRICS**

### **Technical Metrics**
- **Component Reuse:** >70% of UI components reused
- **Integration Success:** 100% compatibility with existing systems
- **Performance:** Recipe generation <3 seconds
- **Error Rate:** <5% AI generation failures

### **User Experience Metrics**
- **Time to First Recipe:** <2 minutes from sign-up
- **Creation Success Rate:** >90% of users successfully create recipes
- **AI Satisfaction:** >80% of generated recipes meet user expectations
- **Modification Conversion:** >60% of created recipes get modified

### **Business Metrics**
- **MVP Completion:** Achieve 90% overall project completion
- **User Engagement:** Average 3+ recipes created per user
- **Feature Adoption:** >70% of users try AI creation
- **Retention:** Week 1 retention >40%

---

## 🚀 **COMPETITIVE DIFFERENTIATORS**

### **vs. ChatGPT**
- **Structured Interface:** No chat confusion, clear inputs/outputs
- **Recipe-Specific AI:** Trained on cooking patterns and constraints
- **Instant Integration:** Generated recipes immediately saveable and modifiable

### **vs. Allrecipes/Yummly**
- **Personalization:** AI creates recipes for specific needs, not browsing
- **No Ads:** Clean, focused creation experience
- **Modification Integration:** Seamless refinement after creation

### **vs. Paprika/Mealime**
- **AI-Powered:** No manual ingredient entry required
- **Dietary Expertise:** Built-in support for complex dietary constraints
- **Version Management:** Complete recipe evolution tracking

---

## 📞 **DEVELOPMENT RESOURCES**

### **Key Files to Modify/Create**
```
src/services/supabase/recipeService.ts (add CRUD methods)
src/pages/RecipeCreate.tsx (new page)
src/components/recipe/create/ (new directory)
├── CreateRecipePanel.tsx
├── ConceptInput.tsx
├── ConstraintSelector.tsx
└── AIRecipeGenerator.tsx
src/App.tsx (add /recipes/create route)
```

### **API Integration Requirements**
- AI service endpoint configuration
- Structured prompting templates
- Response validation schemas
- Error handling and retry logic

### **Testing Requirements**
- Unit tests for new components
- Integration tests for AI service
- E2E tests for complete creation flow
- Performance tests for AI response times

---

## 🎯 **NEXT STEPS**

### **Immediate (This Week)**
1. **Phase 1 Implementation:** Begin basic CRUD foundation
2. **Component Audit:** Finalize reuse mapping with existing components
3. **Database Schema:** Verify all required fields exist
4. **Route Setup:** Add `/recipes/create` to router

### **Short Term (Next 2 Weeks)**
1. **Phase 2 Implementation:** AI-powered creation workflow
2. **Integration Testing:** Ensure compatibility with existing systems
3. **UX Polish:** Refine interaction design and animations
4. **Mobile Optimization:** Responsive design implementation

### **Medium Term (Next Month)**
1. **Phase 3 Implementation:** Enhancement and edge cases
2. **Performance Optimization:** AI response caching and optimization
3. **User Testing:** Gather feedback on creation experience
4. **Production Deployment:** Complete MVP release

---

## 📊 **RISK ASSESSMENT**

### **High Risk**
- **AI Quality:** Generated recipes may not meet user expectations
- **Performance:** AI response times could impact UX
- **Integration Complexity:** Connecting AI to existing systems

### **Medium Risk**
- **User Adoption:** Users may prefer manual creation
- **Cost:** AI API costs could scale quickly
- **Technical Debt:** Rapid development may create maintenance issues

### **Mitigation Strategies**
- **AI Quality:** Extensive prompt engineering and validation
- **Performance:** Caching, optimistic updates, loading states
- **Integration:** Leverage existing 70% infrastructure
- **User Adoption:** Provide manual creation fallback
- **Cost:** Implement usage limits and monitoring

---

## ✅ **ACCEPTANCE CRITERIA**

### **MVP Completion**
- [ ] Users can create recipes via 3-step AI workflow
- [ ] Generated recipes are saveable and modifiable
- [ ] All dietary constraints work correctly
- [ ] Mobile and desktop experiences are equivalent
- [ ] Integration with existing authentication and spaces
- [ ] Performance meets <3 second generation time
- [ ] Error handling covers all edge cases

### **Quality Gates**
- [ ] 70% component reuse achieved
- [ ] Zero breaking changes to existing functionality
- [ ] All automated tests pass
- [ ] Accessibility compliance achieved
- [ ] Performance budgets met

---

## 🎉 **SUCCESS OUTCOME**

Upon completion of this PRD, Culinova will achieve:

1. **MVP Status:** Fully functional recipe creation and management
2. **Competitive Advantage:** Unique AI-powered creation workflow
3. **User Delight:** Chat-free, instant recipe generation
4. **Technical Excellence:** 70% code reuse, clean architecture
5. **Business Readiness:** Complete feature set for user testing and feedback

The system will transform from a sophisticated recipe viewer into a complete recipe management platform, ready for production deployment and user acquisition.

---

**Document Status:** ✅ READY FOR DEVELOPMENT  
**Next Review:** After Phase 1 completion  
**Stakeholders:** Development Team, Product Owner, Users
