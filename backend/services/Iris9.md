Here are three variations of the Iris dataset in ARFF format (ready for WEKA), created by applying distinct techniques (feature scaling, adding Gaussian noise, and stratified sampling) so that the data values and characteristics are different from the original dataset.

---

### Dataset 1: Min-Max Scaled (Normalized to $[0, 1]$)

This dataset normalizes all numeric attributes to a scale between 0 and 1, which is useful when testing clustering performance without attribute scale bias.

```arff
@RELATION iris_normalized

@ATTRIBUTE sepallength REAL
@ATTRIBUTE sepalwidth REAL
@ATTRIBUTE petallength REAL
@ATTRIBUTE petalwidth REAL
@ATTRIBUTE class {Iris-setosa,Iris-versicolor,Iris-virginica}

@DATA
0.2222,0.6250,0.0678,0.0417,Iris-setosa
0.1667,0.4167,0.0678,0.0417,Iris-setosa
0.1111,0.5000,0.0508,0.0417,Iris-setosa
0.0833,0.4583,0.0847,0.0417,Iris-setosa
0.1944,0.6667,0.0678,0.0417,Iris-setosa
0.7500,0.3750,0.6271,0.5417,Iris-versicolor
0.5833,0.3750,0.5932,0.5833,Iris-versicolor
0.7222,0.3333,0.6610,0.5833,Iris-versicolor
0.3333,0.0000,0.5085,0.5000,Iris-versicolor
0.6111,0.2083,0.6102,0.5833,Iris-versicolor
0.5556,0.2917,0.8475,1.0000,Iris-virginica
0.4167,0.2917,0.6949,0.7500,Iris-virginica
0.7778,0.4167,0.8305,0.8333,Iris-virginica
0.5556,0.3750,0.7797,0.7083,Iris-virginica
0.6111,0.4167,0.8136,0.8750,Iris-virginica

```

---

### Dataset 2: Perturbed / Noisy Variant

Small Gaussian noise (variance added) has been introduced to simulate measurement errors or alternate plant populations while maintaining similar overall distributions.

```arff
@RELATION iris_perturbed

@ATTRIBUTE sepallength REAL
@ATTRIBUTE sepalwidth REAL
@ATTRIBUTE petallength REAL
@ATTRIBUTE petalwidth REAL
@ATTRIBUTE class {Iris-setosa,Iris-versicolor,Iris-virginica}

@DATA
5.18,3.42,1.45,0.22,Iris-setosa
4.83,3.08,1.36,0.18,Iris-setosa
4.75,3.15,1.32,0.21,Iris-setosa
5.42,3.85,1.68,0.38,Iris-setosa
4.38,2.92,1.43,0.19,Iris-setosa
6.92,3.12,4.65,1.38,Iris-versicolor
6.45,3.28,4.52,1.54,Iris-versicolor
5.58,2.25,4.03,1.27,Iris-versicolor
6.53,2.74,4.64,1.48,Iris-versicolor
5.74,2.83,4.48,1.32,Iris-versicolor
6.25,3.25,5.92,2.46,Iris-virginica
5.84,2.65,5.15,1.93,Iris-virginica
7.03,3.06,5.84,2.05,Iris-virginica
6.35,2.84,5.63,1.82,Iris-virginica
6.48,3.05,5.76,2.18,Iris-virginica

```

---

### Dataset 3: Stratified Subsample Subset

A shuffled, reduced subset extracted from different indices of the original dataset to provide distinct row ordering and data distribution for cluster testing.

```arff
@RELATION iris_subset

@ATTRIBUTE sepallength REAL
@ATTRIBUTE sepalwidth REAL
@ATTRIBUTE petallength REAL
@ATTRIBUTE petalwidth REAL
@ATTRIBUTE class {Iris-setosa,Iris-versicolor,Iris-virginica}

@DATA
4.8,3.4,1.6,0.2,Iris-setosa
5.7,4.4,1.5,0.4,Iris-setosa
5.2,4.1,1.5,0.1,Iris-setosa
4.5,2.3,1.3,0.3,Iris-setosa
5.1,3.8,1.9,0.4,Iris-setosa
6.0,2.2,4.0,1.0,Iris-versicolor
5.6,2.9,3.6,1.3,Iris-versicolor
6.8,2.8,4.8,1.4,Iris-versicolor
5.8,2.7,3.9,1.2,Iris-versicolor
5.7,3.0,4.2,1.2,Iris-versicolor
7.6,3.0,6.6,2.1,Iris-virginica
7.3,2.9,6.3,1.8,Iris-virginica
6.8,3.0,5.5,2.1,Iris-virginica
7.7,2.8,6.7,2.0,Iris-virginica
6.9,3.1,5.4,2.1,Iris-virginica

```