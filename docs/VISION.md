### Vision
Given:
* the developer should be given direct control over when data
  is loaded.
* determining whether data is loaded, loading or not loaded is a common problem that can be handled by common code and a common API.
* defined loading order (caused by data dependencies) can be
  clearly modelled, and not just left up to chance, the view hierarchy or
  view loading.
* Larger apps will share data between views.

#### and...
* Data fetching *should not* be coupled to the view loading. 
* Data fetching *should not* be tied to the URL structure.
* The view hierarchy *should not* dictate the data loading strategy

