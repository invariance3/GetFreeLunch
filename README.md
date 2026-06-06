# 🥪 Come Get Free Lunch!

**A playful, interactive lesson about the Online No Free Lunch theorem.**

The lunch is free. The mistakes are not.

You play the adaptive adversary in a café-themed machine-learning duel. The learner predicts whether each item is a 🍅 tomato or 🫐 blueberry. Then you reveal the truth, update its worldview, and try to make it regret ordering the special.

## Today’s Menu

### ⚔️ The House Duel

Challenge an online learner one item at a time:

1. Choose a fresh point.
2. Watch the learner predict 🍅 or 🫐.
3. Serve the opposite label, if it remains consistent with the surviving hypotheses.
4. Force as many mistakes as possible before the learner identifies the hidden rule.

The challenge is governed by the **Littlestone dimension** of the hypothesis class.

### 🎯 Training Sandbox

Build an adversarial training set for a k-nearest-neighbors classifier.

Place tomatoes and blueberries on the board, watch kNN divide the café into territories, and arrange the data so confidently that it confidently gets everything wrong.

### 🎲 Hidden-Menu Challenge

The true labeling rule is hidden. You receive a few samples, infer what the kitchen is cooking, and construct the worst possible training set.

No peeking at the recipe.

## The Fine Print

In online learning, the learner repeatedly:

1. Receives an instance \(x_t\).
2. Predicts a label \(\hat{y}_t\).
3. Observes the true label \(y_t\).
4. Updates its predictor.

For every learning rule on a finite domain \(X\), there is a labeling and sequence that forces at least \(|X|\) mistakes.

The adversary simply presents each point once and assigns the label opposite the learner’s prediction. If \(X\) is infinite, fresh points can keep arriving forever.

Memorization eventually saves you on a finite menu. Whether that feels like learning is between you and the chef.

## Play

🎮 **[Enter the Free Lunch Café](https://invariance3.github.io/GetFreeLunch/)**

No installation. No reservation. Generalization sold separately.

## Run Locally

```bash
git clone https://github.com/invariance3/GetFreeLunch.git
cd GetFreeLunch
open index.html
